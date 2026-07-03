const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { readValues } = require('./device/tuya.deviceMapping');
const { API, DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { EVENTS } = require('../../../utils/constants');
const { CLOUD_STRATEGY, getConfiguredCloudReadStrategy } = require('./utils/tuya.cloudStrategy');
const { normalizeBoolean } = require('./utils/tuya.normalize');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { localPoll } = require('./tuya.localPoll');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');
const { isLocalSkipNeeded, recordLocalFailure, recordLocalSuccess } = require('./utils/tuya.degraded');

const SAME_VALUE_EMIT_INTERVAL_MS = 3 * 60 * 1000;

const getFeatureCode = (deviceFeature) => {
  if (!deviceFeature || !deviceFeature.external_id) {
    return null;
  }
  const parts = String(deviceFeature.external_id).split(':');
  if (parts.length >= 2) {
    return parts[parts.length - 1] || null;
  }
  return null;
};

const getFeatureReader = (deviceFeature) => {
  if (!deviceFeature || !deviceFeature.category || !deviceFeature.type) {
    return null;
  }
  const categoryReaders = readValues[deviceFeature.category];
  if (!categoryReaders) {
    return null;
  }
  return categoryReaders[deviceFeature.type] || null;
};

const hasDpsKey = (dps, key) => {
  const stringKey = String(key);
  return Object.prototype.hasOwnProperty.call(dps, stringKey) || Object.prototype.hasOwnProperty.call(dps, key);
};

const getCurrentFeatureState = (gladys, deviceFeature) => {
  const selector = deviceFeature && deviceFeature.selector;
  if (selector && gladys && gladys.stateManager && typeof gladys.stateManager.get === 'function') {
    const currentFeature = gladys.stateManager.get('deviceFeature', selector);
    if (currentFeature) {
      return {
        lastValue: Object.prototype.hasOwnProperty.call(currentFeature, 'last_value')
          ? currentFeature.last_value
          : deviceFeature && deviceFeature.last_value,
        lastValueChanged: Object.prototype.hasOwnProperty.call(currentFeature, 'last_value_changed')
          ? currentFeature.last_value_changed
          : deviceFeature && deviceFeature.last_value_changed,
      };
    }
  }
  return {
    lastValue: deviceFeature ? deviceFeature.last_value : undefined,
    lastValueChanged: deviceFeature ? deviceFeature.last_value_changed : undefined,
  };
};

const toTimestamp = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return timestamp;
};

const emitFeatureState = (gladys, deviceFeature, transformedValue, previousValue, previousValueChangedAt) => {
  if (transformedValue === null || transformedValue === undefined) {
    return { emitted: false, changed: false };
  }

  const changed = previousValue !== transformedValue;
  let emitted = changed;

  if (!emitted) {
    const lastValueChangedTs = toTimestamp(previousValueChangedAt);
    const now = Date.now();
    if (lastValueChangedTs === null || now - lastValueChangedTs >= SAME_VALUE_EMIT_INTERVAL_MS) {
      emitted = true;
    }
  }

  if (emitted) {
    gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: deviceFeature.external_id,
      state: transformedValue,
    });
  }

  return { emitted, changed };
};

const extractValuesFromResultArray = (result) => {
  const values = {};
  const entries = Array.isArray(result) ? result : [];
  entries.forEach((feature) => {
    if (!feature || typeof feature !== 'object' || feature.code === undefined || feature.code === null) {
      return;
    }
    values[String(feature.code)] = feature.value;
  });
  return values;
};

const extractShadowValues = (response) => {
  const payload = response && response.result;
  const properties = payload && Array.isArray(payload.properties) ? payload.properties : [];
  return extractValuesFromResultArray(properties);
};

/**
 * @description Apply a local DPS map to a device's features and emit their new states. Shared by the
 * scheduled local poll and the persistent-connection push handler so both go through the exact same
 * DPS -> feature -> state transformation (single source of truth).
 * @param {object} gladys - The Gladys instance (stateManager + event emit).
 * @param {object} device - The Gladys device (with features).
 * @param {object} dps - The DPS map (full or partial).
 * @returns {object} { handledCodes: Set<string>, changed: number } of features that were emitted.
 * @example
 * const { handledCodes } = emitLocalDpsStates(gladys, device, { '1': true });
 */
const emitLocalDpsStates = (gladys, device, dps) => {
  const handledCodes = new Set();
  let changed = 0;
  const deviceFeatures = Array.isArray(device.features) ? device.features : [];

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
      logger.warn(`[Tuya][poll] local reader failed for code=${code}`, e);
      return;
    }
    const { lastValue, lastValueChanged } = getCurrentFeatureState(gladys, deviceFeature);
    const result = emitFeatureState(gladys, deviceFeature, transformedValue, lastValue, lastValueChanged);
    if (result.changed) {
      changed += 1;
    }
    handledCodes.add(code);
  });

  return { handledCodes, changed };
};

/**
 * @description Poll the given features against the Tuya cloud API and emit state changes.
 * @param {object} self - The TuyaHandler instance (passed explicitly to avoid `this` rebinding).
 * @param {object} device - The Gladys device (used to resolve the cloud read strategy).
 * @param {Array} deviceFeatures - Features to poll.
 * @param {string} topic - Tuya device id used for the API path and logs.
 * @returns {Promise<object>} Summary with polled/handled/changed/missing/skipped counters.
 * @example
 * const summary = await pollCloudFeatures(this, device, deviceFeatures, topic);
 */
async function pollCloudFeatures(self, device, deviceFeatures, topic) {
  const summary = {
    polled: Array.isArray(deviceFeatures) ? deviceFeatures.length : 0,
    handled: 0,
    changed: 0,
    missing: 0,
    skipped: 0,
  };
  if (!Array.isArray(deviceFeatures) || deviceFeatures.length === 0) {
    return summary;
  }

  if (!self.connector || typeof self.connector.request !== 'function') {
    logger.warn(`[Tuya][poll][cloud] connector unavailable for device=${topic}`);
    return summary;
  }

  const cloudReadStrategy = getConfiguredCloudReadStrategy(device);
  const response =
    cloudReadStrategy === CLOUD_STRATEGY.SHADOW
      ? await self.connector.request({
          method: 'GET',
          path: `${API.VERSION_2_0}/thing/${topic}/shadow/properties`,
        })
      : await self.connector.request({
          method: 'GET',
          path: `${API.VERSION_1_0}/devices/${topic}/status`,
        });

  const values =
    cloudReadStrategy === CLOUD_STRATEGY.SHADOW
      ? extractShadowValues(response)
      : extractValuesFromResultArray(response && response.result);

  deviceFeatures.forEach((deviceFeature) => {
    const code = getFeatureCode(deviceFeature);
    if (!code) {
      summary.skipped += 1;
      return;
    }

    const reader = getFeatureReader(deviceFeature);
    if (!reader) {
      summary.skipped += 1;
      return;
    }

    const value = values[code];
    if (value === undefined) {
      summary.missing += 1;
      return;
    }
    let transformedValue;
    try {
      transformedValue = reader(value, deviceFeature);
    } catch (e) {
      summary.skipped += 1;
      logger.warn(`[Tuya][poll][cloud] reader failed for device=${topic} code=${code}`, e);
      return;
    }
    const { lastValue, lastValueChanged } = getCurrentFeatureState(self.gladys, deviceFeature);
    const { changed } = emitFeatureState(self.gladys, deviceFeature, transformedValue, lastValue, lastValueChanged);
    if (changed) {
      summary.changed += 1;
    }
    summary.handled += 1;
  });

  return summary;
}

/**
 *
 * @description Poll values of an Tuya device.
 * @param {object} device - The device to poll.
 * @returns {Promise} Promise of nothing.
 * @example
 * poll(device);
 */
async function poll(device) {
  const externalId = device.external_id;
  const [prefix, topic] = device.external_id.split(':');

  if (prefix !== 'tuya') {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" should starts with "tuya:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" have no network indicator`);
  }

  const params = device.params || [];
  const deviceFeatures = Array.isArray(device.features) ? device.features : [];
  const ipAddress = getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS);
  const localKey = getParamValue(params, DEVICE_PARAM_NAME.LOCAL_KEY);
  const protocolVersionRaw = getParamValue(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const protocolVersion =
    protocolVersionRaw !== null && protocolVersionRaw !== undefined ? String(protocolVersionRaw).trim() : undefined;
  const localOverride = normalizeBoolean(getParamValue(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE));
  const hasLocalConfig = Boolean(ipAddress && localKey && protocolVersion && localOverride === true);
  const requestedMode = localOverride === true ? 'local' : 'cloud';
  logger.debug(
    `[Tuya][poll] device=${topic} requested=${requestedMode} has_local=${Boolean(
      hasLocalConfig,
    )} protocol=${protocolVersion || 'none'} ip=${ipAddress || 'none'}`,
  );

  let modeUsed = 'cloud';
  let localHandled = 0;
  let localChanged = 0;
  let cloudSummary = {
    polled: 0,
    handled: 0,
    changed: 0,
    missing: 0,
    skipped: 0,
  };
  let fallbackReason = 'none';

  if (localOverride === true && !hasLocalConfig) {
    fallbackReason = 'incomplete_local_config';
    logger.warn(
      `[Tuya][poll] local mode enabled but config is incomplete for device=${topic} (ip/protocol/local_key missing)`,
    );
  }

  const localSkipped = hasLocalConfig && isLocalSkipNeeded(this.degradedDevices, topic);
  if (localSkipped) {
    fallbackReason = 'device_degraded';
    logger.debug(`[Tuya][poll] device=${topic} skipping local (degraded backoff active), falling back to cloud`);
  }

  // Coexistence gate: a Tuya device accepts only one local session at a time, so when a healthy
  // persistent local connection is already streaming pushed DP updates for this device, the scheduled
  // poll must not open a second local (or redundant cloud) read. When the persistent connection is
  // stale/failed, isPersistentConnectionHealthy returns false and the normal local->degraded->cloud
  // path below runs unchanged (the poll cadence acts as the freshness watchdog / fallback).
  const persistentHealthy =
    hasLocalConfig &&
    typeof this.isPersistentConnectionHealthy === 'function' &&
    this.isPersistentConnectionHealthy(topic);
  if (persistentHealthy) {
    fallbackReason = 'persistent_push_active';
    logger.debug(`[Tuya][poll] device=${topic} skipping poll (persistent local push active)`);
    return;
  }

  // A connected-but-silent persistent socket still holds the single local session. Never open a
  // competing local poll in that case (it would time out); refresh via cloud instead.
  const persistentConnected =
    hasLocalConfig &&
    typeof this.isPersistentConnectionConnected === 'function' &&
    this.isPersistentConnectionConnected(topic);
  if (persistentConnected) {
    // Recycle the stale-but-open socket so the single local session frees up: the next cycles then
    // follow the intended priority (persistent -> local poll -> cloud) instead of staying on cloud.
    this.recyclePersistentConnection(topic);
    fallbackReason = 'persistent_stale_cloud_refresh';
    logger.debug(`[Tuya][poll] device=${topic} persistent connected but silent: recycling + cloud refresh this cycle`);
  }

  if (hasLocalConfig && !localSkipped && !persistentConnected) {
    try {
      const localResult = await localPoll({
        deviceId: topic,
        ip: ipAddress,
        localKey,
        protocolVersion,
        timeoutMs: 3000,
        fastScan: true,
        logDps: false,
      });

      const dps = localResult && localResult.dps ? localResult.dps : null;
      if (dps && typeof dps === 'object') {
        const { handledCodes, changed: localChangedCount } = emitLocalDpsStates(this.gladys, device, dps);
        localHandled = handledCodes.size;
        localChanged = localChangedCount;
        const pendingCloudFeatures = deviceFeatures.filter(
          (deviceFeature) => !handledCodes.has(getFeatureCode(deviceFeature)),
        );

        if (pendingCloudFeatures.length === 0) {
          modeUsed = 'local';
          recordLocalSuccess(this.degradedDevices, topic);
          logger.debug(
            `[Tuya][poll] device=${topic} mode=${modeUsed} local_handled=${localHandled} local_changed=${localChanged} cloud_handled=0 cloud_changed=0 cloud_missing=0 fallback=${fallbackReason}`,
          );
          return;
        }

        fallbackReason = 'partial_local_mapping';
        recordLocalSuccess(this.degradedDevices, topic);
        try {
          cloudSummary = await pollCloudFeatures(this, device, pendingCloudFeatures, topic);
        } catch (e) {
          logger.warn(`[Tuya][poll] local poll succeeded but cloud fallback failed for ${topic}`, e);
          fallbackReason = 'cloud_fallback_failed';
        }
        modeUsed = 'local+cloud';
        logger.debug(
          `[Tuya][poll] device=${topic} mode=${modeUsed} local_handled=${localHandled} local_changed=${localChanged} cloud_handled=${cloudSummary.handled} cloud_changed=${cloudSummary.changed} cloud_missing=${cloudSummary.missing} fallback=${fallbackReason}`,
        );
        return;
      }

      fallbackReason = 'invalid_local_payload';
      logger.warn(`[Tuya][poll] local poll returned invalid DPS payload for ${topic}, falling back to cloud`);
      // A non-throwing but malformed payload is still a local failure: record it (forced, since it is
      // not a network error) so a device stuck returning garbage trips the degraded backoff too.
      recordLocalFailure(this.degradedDevices, topic, new Error('invalid_local_payload'), undefined, true);
    } catch (e) {
      logger.warn(`[Tuya][poll] local poll failed for ${topic}, falling back to cloud`, e);
      fallbackReason = 'local_poll_failed';
      recordLocalFailure(this.degradedDevices, topic, e);
    }
  }

  // When the device explicitly opted into local mode and the cloud connector
  // is missing, skip the cloud fallback to avoid flooding the logs with a
  // `connector unavailable` warning on every poll cycle. The cloud-direct
  // path (LOCAL_OVERRIDE=false) still goes through pollCloudFeatures, which
  // surfaces the warn so a missing connector is visible.
  if (hasLocalConfig && (!this.connector || typeof this.connector.request !== 'function')) {
    fallbackReason = fallbackReason === 'none' ? 'cloud_unavailable' : `${fallbackReason}+cloud_unavailable`;
    logger.debug(
      `[Tuya][poll] device=${topic} mode=${modeUsed} local_handled=${localHandled} local_changed=${localChanged} cloud_handled=0 cloud_changed=0 cloud_missing=0 fallback=${fallbackReason}`,
    );
    return;
  }

  try {
    cloudSummary = await pollCloudFeatures(this, device, deviceFeatures, topic);
  } catch (e) {
    logger.warn(`[Tuya][poll] cloud poll failed for ${topic}`, e);
    fallbackReason = fallbackReason === 'none' ? 'cloud_poll_failed' : `${fallbackReason}+cloud_poll_failed`;
  }
  logger.debug(
    `[Tuya][poll] device=${topic} mode=${modeUsed} local_handled=${localHandled} local_changed=${localChanged} cloud_handled=${cloudSummary.handled} cloud_changed=${cloudSummary.changed} cloud_missing=${cloudSummary.missing} fallback=${fallbackReason}`,
  );
}

module.exports = {
  poll,
  // Exported so the persistent-connection push handler reuses the exact same DPS -> feature -> state
  // pipeline as the scheduled poll (single source of truth).
  emitLocalDpsStates,
  getFeatureCode,
  getFeatureReader,
  hasDpsKey,
  getCurrentFeatureState,
  emitFeatureState,
};
