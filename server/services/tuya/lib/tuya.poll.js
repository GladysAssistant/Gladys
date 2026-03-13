const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { readValues } = require('./device/tuya.deviceMapping');
const { API, DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { EVENTS } = require('../../../utils/constants');
const { normalizeBoolean } = require('./utils/tuya.normalize');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { localPoll } = require('./tuya.localPoll');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');

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

const pollCloudFeatures = async function pollCloudFeatures(deviceFeatures, topic) {
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

  if (!this.connector || typeof this.connector.request !== 'function') {
    logger.warn(`[Tuya][poll][cloud] connector unavailable for device=${topic}`);
    return summary;
  }

  const response = await this.connector.request({
    method: 'GET',
    path: `${API.VERSION_1_0}/devices/${topic}/status`,
  });

  const values = {};
  const result = Array.isArray(response && response.result) ? response.result : [];
  result.forEach((feature) => {
    if (!feature || typeof feature !== 'object' || feature.code === undefined || feature.code === null) {
      return;
    }
    values[String(feature.code)] = feature.value;
  });

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
    const { lastValue, lastValueChanged } = getCurrentFeatureState(this.gladys, deviceFeature);
    const { changed } = emitFeatureState(this.gladys, deviceFeature, transformedValue, lastValue, lastValueChanged);
    if (changed) {
      summary.changed += 1;
    }
    summary.handled += 1;
  });

  return summary;
};

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

  if (hasLocalConfig) {
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
        const pendingCloudFeatures = [];

        deviceFeatures.forEach((deviceFeature) => {
          const code = getFeatureCode(deviceFeature);
          const dpsKey = getLocalDpsFromCode(code, device);
          const reader = getFeatureReader(deviceFeature);

          if (!code || dpsKey === null || !reader || !hasDpsKey(dps, dpsKey)) {
            pendingCloudFeatures.push(deviceFeature);
            return;
          }

          const rawValue = Object.prototype.hasOwnProperty.call(dps, String(dpsKey))
            ? dps[String(dpsKey)]
            : dps[dpsKey];
          if (rawValue === undefined) {
            pendingCloudFeatures.push(deviceFeature);
            return;
          }
          let transformedValue;
          try {
            transformedValue = reader(rawValue, deviceFeature);
          } catch (e) {
            pendingCloudFeatures.push(deviceFeature);
            logger.warn(`[Tuya][poll] local reader failed for device=${topic} code=${code}; falling back to cloud`, e);
            return;
          }
          const { lastValue, lastValueChanged } = getCurrentFeatureState(this.gladys, deviceFeature);
          const { changed } = emitFeatureState(
            this.gladys,
            deviceFeature,
            transformedValue,
            lastValue,
            lastValueChanged,
          );
          if (changed) {
            localChanged += 1;
          }
          localHandled += 1;
        });

        if (pendingCloudFeatures.length === 0) {
          modeUsed = 'local';
          logger.debug(
            `[Tuya][poll] device=${topic} mode=${modeUsed} local_handled=${localHandled} local_changed=${localChanged} cloud_handled=0 cloud_changed=0 cloud_missing=0 fallback=${fallbackReason}`,
          );
          return;
        }

        fallbackReason = 'partial_local_mapping';
        try {
          cloudSummary = await pollCloudFeatures.call(this, pendingCloudFeatures, topic);
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
    } catch (e) {
      logger.warn(`[Tuya][poll] local poll failed for ${topic}, falling back to cloud`, e);
      fallbackReason = 'local_poll_failed';
    }
  }

  try {
    cloudSummary = await pollCloudFeatures.call(this, deviceFeatures, topic);
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
};
