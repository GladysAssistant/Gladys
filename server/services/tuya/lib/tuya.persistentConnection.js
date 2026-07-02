const TuyAPI = require('tuyapi');
const TuyAPINewGen = require('@demirdeniz/tuyapi-newgen');
const logger = require('../../../utils/logger');
const { DEVICE_PARAM_NAME, GLADYS_VARIABLES } = require('./utils/tuya.constants');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { normalizeBoolean } = require('./utils/tuya.normalize');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');
const { recordLocalFailure, recordLocalSuccess } = require('./utils/tuya.degraded');
const {
  getFeatureCode,
  getFeatureReader,
  hasDpsKey,
  getCurrentFeatureState,
  emitFeatureState,
} = require('./tuya.poll');

// A persistent local connection stays open and receives pushed DP updates in real time (events),
// instead of the one-shot poll. Devices that cannot sustain the socket (battery/asleep, offline,
// firmware that drops it) exhaust the bounded retries, reach the terminal `failed` state, and the
// scheduled poll (with its own degraded backoff) takes over — the split is driven by behavior, no
// battery flag needed.
const MAX_PERSISTENT_RETRIES = 3;
const RETRY_DELAYS_MS = [3000, 10000, 30000];
// A "connected" socket that stops delivering data for longer than this is treated as unhealthy so the
// scheduled poll resumes as a safety net. The poll cadence is thus the freshness watchdog.
const PERSISTENT_MAX_SILENCE_MS = 90 * 1000;

const isNewGenProtocol = (protocolVersion) => protocolVersion === '3.4' || protocolVersion === '3.5';

const extractPushedDps = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if (payload.dps && typeof payload.dps === 'object') {
    return payload.dps;
  }
  return payload;
};

const formatSocketError = (err) => (err && err.message ? err.message : 'persistent socket error');

const getRetryDelay = (retryCount) => RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];

const teardownApi = (api) => {
  if (!api) {
    return;
  }
  try {
    api.disconnect();
  } catch (e) {
    // ignore teardown errors — the api is being dropped anyway
  }
};

const parseLocalConfig = (device) => {
  const externalId = device && device.external_id;
  if (typeof externalId !== 'string') {
    return null;
  }
  const [prefix, topic] = externalId.split(':');
  if (prefix !== 'tuya' || !topic) {
    return null;
  }
  const params = Array.isArray(device.params) ? device.params : [];
  const ip = getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS);
  const localKey = getParamValue(params, DEVICE_PARAM_NAME.LOCAL_KEY);
  const protocolRaw = getParamValue(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const protocolVersion = protocolRaw !== null && protocolRaw !== undefined ? String(protocolRaw).trim() : undefined;
  const localOverride = normalizeBoolean(getParamValue(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE));
  if (!ip || !localKey || !protocolVersion || localOverride !== true) {
    return null;
  }
  return { topic, ip, localKey, protocolVersion };
};

const scheduleReconnect = (self, entry) => {
  const { topic } = entry;
  if (self.persistentConnections[topic] !== entry || entry.status === 'failed') {
    return;
  }
  if (entry.retryCount >= MAX_PERSISTENT_RETRIES) {
    entry.status = 'failed';
    logger.info(
      `[Tuya][persistent] giving up device=${topic} after ${entry.retryCount} retries; scheduled poll takes over`,
    );
    return;
  }
  entry.status = 'reconnecting';
  const delay = getRetryDelay(entry.retryCount);
  entry.retryCount += 1;
  if (entry.retryTimer) {
    clearTimeout(entry.retryTimer);
  }
  entry.retryTimer = setTimeout(() => {
    if (self.persistentConnections[topic] !== entry) {
      return;
    }
    teardownApi(entry.api);
    // eslint-disable-next-line no-use-before-define
    openPersistentConnection(self, entry);
  }, delay);
  if (entry.retryTimer && typeof entry.retryTimer.unref === 'function') {
    entry.retryTimer.unref();
  }
};

/**
 * @description (Re)open the persistent socket for an entry and wire its event listeners.
 * @param {object} self - The TuyaHandler instance.
 * @param {object} entry - The persistent-connection entry (topic/ip/localKey/protocol/device/api...).
 * @example
 * openPersistentConnection(this, entry);
 */
function openPersistentConnection(self, entry) {
  const { topic, ip, localKey, protocolVersion, device } = entry;
  const TuyaLocalApi = isNewGenProtocol(protocolVersion) ? TuyAPINewGen : TuyAPI;
  const options = {
    id: topic,
    key: localKey,
    ip,
    version: protocolVersion,
    // Persistent mode: connect and keep listening. issueGetOnConnect seeds full state on connect;
    // issueRefreshOnConnect asks the device to push DP changes; issueRefreshOnPing makes each
    // heartbeat (~10s on 3.3 / ~25s on 3.5) pull the current state over the SAME open socket. This
    // keeps the connection "fresh" for devices that never push unsolicited updates (e.g. an idle
    // thermostat), so the scheduled poll skips entirely instead of falling back to cloud — all local,
    // no cloud quota, while state changes still arrive in real time.
    issueGetOnConnect: true,
    issueRefreshOnConnect: true,
    issueRefreshOnPing: true,
  };
  if (protocolVersion === '3.5') {
    options.socketTimeout = 5000;
  }
  const api = new TuyaLocalApi(options);
  entry.api = api;
  entry.status = 'connecting';

  const isActive = () => self.persistentConnections[topic] === entry && entry.api === api;

  // Keep the error listener for the life of the instance (removing it early can surface an
  // uncaughtException, as documented in tuya.localPoll).
  api.on('error', (err) => {
    if (!isActive()) {
      return;
    }
    logger.info(`[Tuya][persistent] socket error device=${topic}: ${formatSocketError(err)}`);
    recordLocalFailure(self.degradedDevices, topic, err);
  });
  api.on('connected', () => {
    if (!isActive()) {
      return;
    }
    entry.status = 'connected';
    entry.retryCount = 0;
    entry.lastConnectedAt = Date.now();
    recordLocalSuccess(self.degradedDevices, topic);
    logger.debug(`[Tuya][persistent] connected device=${topic}`);
  });
  const onPush = (payload) => {
    if (!isActive()) {
      return;
    }
    self.handlePushedDps(device, extractPushedDps(payload));
  };
  api.on('data', onPush);
  api.on('dp-refresh', onPush);
  api.on('disconnected', () => {
    if (!isActive()) {
      return;
    }
    logger.debug(`[Tuya][persistent] disconnected device=${topic}`);
    scheduleReconnect(self, entry);
  });

  // Fire the connect without blocking the caller (init must not wait on slow devices). Failures are
  // handled here and routed to the bounded reconnect.
  (async () => {
    try {
      await api.connect();
    } catch (err) {
      if (!isActive()) {
        return;
      }
      logger.info(`[Tuya][persistent] connect failed device=${topic}: ${formatSocketError(err)}`);
      recordLocalFailure(self.degradedDevices, topic, err);
      scheduleReconnect(self, entry);
    }
  })();
}

/**
 * @description Open a persistent local connection for a single Gladys Tuya device (if local-capable).
 * @param {object} device - The Gladys device (with params + features).
 * @example
 * this.startPersistentConnectionForDevice(device);
 */
function startPersistentConnectionForDevice(device) {
  if (this.persistentPushEnabled === false) {
    return;
  }
  const config = parseLocalConfig(device);
  if (!config) {
    return;
  }
  const { topic } = config;
  const existing = this.persistentConnections[topic];
  if (
    existing &&
    (existing.status === 'connecting' || existing.status === 'connected' || existing.status === 'reconnecting')
  ) {
    return;
  }
  const entry = {
    device,
    topic,
    ip: config.ip,
    localKey: config.localKey,
    protocolVersion: config.protocolVersion,
    api: null,
    status: 'connecting',
    retryCount: 0,
    retryTimer: null,
    lastConnectedAt: null,
    lastDataAt: null,
  };
  this.persistentConnections[topic] = entry;
  try {
    openPersistentConnection(this, entry);
  } catch (e) {
    logger.info(`[Tuya][persistent] failed to start device=${topic}: ${formatSocketError(e)}`);
    scheduleReconnect(this, entry);
  }
}

/**
 * @description Open persistent local connections for every local-capable Tuya device.
 * @returns {Promise} Resolves once connections have been kicked off (does not await each connect).
 * @example
 * await this.startPersistentConnections();
 */
async function startPersistentConnections() {
  let enabled = true;
  try {
    const raw = await this.gladys.variable.getValue(GLADYS_VARIABLES.PERSISTENT_PUSH_ENABLED, this.serviceId);
    if (raw !== null && raw !== undefined && String(raw) !== '') {
      enabled = normalizeBoolean(raw);
    }
  } catch (e) {
    enabled = true;
  }
  this.persistentPushEnabled = enabled;
  if (!enabled) {
    logger.debug('[Tuya][persistent] disabled by TUYA_PERSISTENT_PUSH_ENABLED; poll-only mode');
    return;
  }

  let devices = [];
  try {
    devices = await this.gladys.device.get({ service: 'tuya' });
  } catch (e) {
    logger.warn('[Tuya][persistent] failed to load devices for persistent connections', e);
    return;
  }

  (Array.isArray(devices) ? devices : []).forEach((device) => {
    try {
      this.startPersistentConnectionForDevice(device);
    } catch (e) {
      // never let a single device break the startup loop
      logger.info(`[Tuya][persistent] start error: ${formatSocketError(e)}`);
    }
  });
}

/**
 * @description Handle a pushed DPS map from a persistent connection: emit Gladys states.
 * @param {object} device - The Gladys device the push belongs to.
 * @param {object} dps - The pushed (usually partial) DPS map.
 * @example
 * this.handlePushedDps(device, { '1': true });
 */
function handlePushedDps(device, dps) {
  if (!dps || typeof dps !== 'object') {
    return;
  }
  const externalId = device && device.external_id;
  const parts = typeof externalId === 'string' ? externalId.split(':') : [];
  const prefix = parts[0];
  const topic = parts[1];
  if (prefix !== 'tuya' || !topic) {
    return;
  }
  const entry = this.persistentConnections[topic];
  if (entry) {
    entry.lastDataAt = Date.now();
  }
  const deviceFeatures = Array.isArray(device.features) ? device.features : [];
  let handled = 0;

  deviceFeatures.forEach((deviceFeature) => {
    const code = getFeatureCode(deviceFeature);
    const dpsKey = getLocalDpsFromCode(code, device);
    const reader = getFeatureReader(deviceFeature);
    if (!code || dpsKey === null || !reader || !hasDpsKey(dps, dpsKey)) {
      return;
    }
    const rawValue = Object.prototype.hasOwnProperty.call(dps, String(dpsKey)) ? dps[String(dpsKey)] : dps[dpsKey];
    if (rawValue === undefined) {
      return;
    }
    let transformedValue;
    try {
      transformedValue = reader(rawValue, deviceFeature);
    } catch (e) {
      logger.warn(`[Tuya][persistent] reader failed device=${topic} code=${code}`, e);
      return;
    }
    const { lastValue, lastValueChanged } = getCurrentFeatureState(this.gladys, deviceFeature);
    emitFeatureState(this.gladys, deviceFeature, transformedValue, lastValue, lastValueChanged);
    handled += 1;
  });

  if (handled > 0) {
    recordLocalSuccess(this.degradedDevices, topic);
  }
}

/**
 * @description Whether a device currently has a healthy persistent connection (used by poll gating).
 * @param {string} topic - The Tuya device id.
 * @returns {boolean} True when connected and not silent for too long.
 * @example
 * this.isPersistentConnectionHealthy('device-id');
 */
function isPersistentConnectionHealthy(topic) {
  const entry = this.persistentConnections && this.persistentConnections[topic];
  if (!entry || entry.status !== 'connected') {
    return false;
  }
  const reference =
    entry.lastDataAt !== null && entry.lastDataAt !== undefined ? entry.lastDataAt : entry.lastConnectedAt;
  if (reference === null || reference === undefined) {
    return false;
  }
  return Date.now() - reference <= PERSISTENT_MAX_SILENCE_MS;
}

/**
 * @description Whether a device currently holds an open persistent socket (status connected),
 * regardless of data freshness. Used by poll gating to never open a competing local session.
 * @param {string} topic - The Tuya device id.
 * @returns {boolean} True when the persistent socket is connected.
 * @example
 * this.isPersistentConnectionConnected('device-id');
 */
function isPersistentConnectionConnected(topic) {
  const entry = this.persistentConnections && this.persistentConnections[topic];
  return Boolean(entry && entry.status === 'connected');
}

/**
 * @description Send a command over an already-open persistent connection when one exists.
 * Tuya devices accept only one local session at a time, so reusing the persistent socket avoids the
 * slow contention of opening a second local connection for the write.
 * @param {string} topic - The Tuya device id.
 * @param {number|string} dps - The local DP id to write.
 * @param {any} value - The value to set.
 * @returns {Promise<boolean>} True if the command was sent over the persistent connection.
 * @example
 * const sent = await this.sendCommandViaPersistentConnection('device-id', 1, true);
 */
async function sendCommandViaPersistentConnection(topic, dps, value) {
  const entry = this.persistentConnections && this.persistentConnections[topic];
  if (!entry || entry.status !== 'connected' || !entry.api || typeof entry.api.set !== 'function') {
    return false;
  }
  await entry.api.set({ dps, set: value });
  return true;
}

/**
 * @description Recycle a persistent connection whose socket is open but no longer delivering data:
 * tear it down and schedule a reconnect. This frees the single local session so the scheduled poll
 * can fall back to a local read on the next cycles (priority: persistent -> local poll -> cloud), and
 * self-heals the connection (or degrades to poll-only if it keeps going silent).
 * @param {string} topic - The Tuya device id.
 * @example
 * this.recyclePersistentConnection('device-id');
 */
function recyclePersistentConnection(topic) {
  const entry = this.persistentConnections && this.persistentConnections[topic];
  if (!entry) {
    return;
  }
  teardownApi(entry.api);
  entry.status = 'reconnecting';
  scheduleReconnect(this, entry);
}

/**
 * @description Tear down the persistent connection of a single device.
 * @param {string} topic - The Tuya device id.
 * @example
 * this.stopPersistentConnectionForDevice('device-id');
 */
function stopPersistentConnectionForDevice(topic) {
  const entry = this.persistentConnections[topic];
  if (!entry) {
    return;
  }
  delete this.persistentConnections[topic];
  if (entry.retryTimer) {
    clearTimeout(entry.retryTimer);
    entry.retryTimer = null;
  }
  teardownApi(entry.api);
}

/**
 * @description Tear down every persistent connection (service stop / reconnect).
 * @example
 * this.stopPersistentConnections();
 */
function stopPersistentConnections() {
  const topics = Object.keys(this.persistentConnections || {});
  topics.forEach((topic) => {
    this.stopPersistentConnectionForDevice(topic);
  });
  this.persistentConnections = {};
}

module.exports = {
  startPersistentConnections,
  startPersistentConnectionForDevice,
  handlePushedDps,
  isPersistentConnectionHealthy,
  isPersistentConnectionConnected,
  sendCommandViaPersistentConnection,
  recyclePersistentConnection,
  stopPersistentConnectionForDevice,
  stopPersistentConnections,
};
