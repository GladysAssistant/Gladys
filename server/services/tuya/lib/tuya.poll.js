const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { readValues } = require('./device/tuya.deviceMapping');
const { API, DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { EVENTS, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');
const { normalizeBoolean, normalizeTemperatureUnit } = require('./utils/tuya.normalize');
const { CLOUD_STRATEGY, getConfiguredCloudStrategy } = require('./utils/tuya.cloudStrategy');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { localPoll } = require('./tuya.localPoll');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');
const { getDeviceType, getFeatureMapping } = require('./mappings');
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

const getTemperatureUnitFromProperties = (device) => {
  if (!device || !device.properties || !Array.isArray(device.properties.properties)) {
    return null;
  }
  const unitProperty = device.properties.properties.find(
    (property) => property.code === 'temp_unit_convert' || property.code === 'unit',
  );
  return normalizeTemperatureUnit(unitProperty && unitProperty.value);
};

const updatePropertyValue = (device, code, value) => {
  if (!device || !device.properties || !Array.isArray(device.properties.properties) || !code) {
    return;
  }
  const propertyIndex = device.properties.properties.findIndex((property) => property && property.code === code);
  if (propertyIndex === -1) {
    return;
  }
  device.properties.properties[propertyIndex] = {
    ...device.properties.properties[propertyIndex],
    value,
  };
};

const getFeatureWithFallbackScale = (device, deviceFeature, code) => {
  if (!deviceFeature || deviceFeature.scale !== undefined) {
    return deviceFeature;
  }
  const deviceType = device && device.device_type ? device.device_type : getDeviceType(device);
  const mapping = getFeatureMapping(code, deviceType);
  if (!mapping || mapping.scale === undefined) {
    return deviceFeature;
  }
  return {
    ...deviceFeature,
    scale: mapping.scale,
  };
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

const isTemperatureFeature = (deviceFeature, code) => {
  return Boolean(
    deviceFeature &&
      (deviceFeature.unit === DEVICE_FEATURE_UNITS.CELSIUS || deviceFeature.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT) &&
      (code === 'temp_set' || code === 'temp_current'),
  );
};

const roundTemperatureValue = (value, code) => {
  if (code === 'temp_set') {
    return Math.round(value);
  }
  return Math.round(value * 10) / 10;
};

const convertTemperatureValue = (value, fromUnit, toUnit, deviceFeature, code) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || !fromUnit || !toUnit || fromUnit === toUnit) {
    return value;
  }
  const convertedValue =
    fromUnit === DEVICE_FEATURE_UNITS.CELSIUS ? celsiusToFahrenheit(numericValue) : fahrenheitToCelsius(numericValue);
  const roundedValue = roundTemperatureValue(convertedValue, code);
  if (code === 'temp_current' && deviceFeature) {
    const min = Number(deviceFeature.min);
    const max = Number(deviceFeature.max);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      const isConvertedInRange = roundedValue >= min && roundedValue <= max;
      const isRawInRange = numericValue >= min && numericValue <= max;
      if (!isConvertedInRange && isRawInRange) {
        return roundTemperatureValue(numericValue, code);
      }
    }
  }
  return roundedValue;
};

const getTemperatureUnitFromLocalDps = (device, dps) => {
  if (!device || !dps || !device.properties || !Array.isArray(device.properties.properties)) {
    return null;
  }
  const unitProperty = device.properties.properties.find(
    (property) => property.code === 'temp_unit_convert' || property.code === 'unit',
  );
  if (!unitProperty || unitProperty.dp_id === undefined || unitProperty.dp_id === null) {
    return null;
  }
  const rawValue = Object.prototype.hasOwnProperty.call(dps, String(unitProperty.dp_id))
    ? dps[String(unitProperty.dp_id)]
    : dps[unitProperty.dp_id];
  updatePropertyValue(device, unitProperty.code, rawValue);
  return normalizeTemperatureUnit(rawValue);
};

const getTemperatureUnitFromValues = (values) => {
  return normalizeTemperatureUnit(values && (values.temp_unit_convert || values.unit));
};

const extractValuesFromResultArray = (device, result) => {
  const values = {};
  const entries = Array.isArray(result) ? result : [];
  entries.forEach((feature) => {
    if (!feature || typeof feature !== 'object' || feature.code === undefined || feature.code === null) {
      return;
    }
    values[String(feature.code)] = feature.value;
    updatePropertyValue(device, feature.code, feature.value);
  });
  return values;
};

const extractShadowValues = (device, response) => {
  const payload = response && response.result;
  const result = payload && Array.isArray(payload.properties) ? payload.properties : [];
  return extractValuesFromResultArray(device, result);
};

const transformFeatureValue = (device, deviceFeature, code, rawValue, deviceTemperatureUnit) => {
  const featureWithFallbackScale = getFeatureWithFallbackScale(device, deviceFeature, code);
  const reader = getFeatureReader(featureWithFallbackScale);
  let transformedValue = reader(rawValue, featureWithFallbackScale);
  if (isTemperatureFeature(featureWithFallbackScale, code)) {
    transformedValue = convertTemperatureValue(
      transformedValue,
      deviceTemperatureUnit,
      featureWithFallbackScale.unit,
      featureWithFallbackScale,
      code,
    );
  }
  return { transformedValue };
};

/**
 * @description Apply a local DPS map to a device's features and emit their new states. Shared by the
 * scheduled local poll and the persistent-connection push handler so both go through the exact same
 * DPS -> feature -> state transformation (single source of truth), including the temperature divider
 * and °C/°F conversion applied by transformFeatureValue. The temperature unit is derived from the dps
 * (then the device properties) when the caller does not pass one, so pushed updates stay correct too.
 * @param {object} gladys - The Gladys instance (stateManager + event emit).
 * @param {object} device - The Gladys device (with features).
 * @param {object} dps - The DPS map (full or partial).
 * @param {string} [deviceTemperatureUnit] - Device temperature unit; derived from dps/device when omitted.
 * @returns {object} { handledCodes: Set<string>, changed: number } of features that were emitted.
 * @example
 * const { handledCodes } = emitLocalDpsStates(gladys, device, { '1': true });
 */
const emitLocalDpsStates = (gladys, device, dps, deviceTemperatureUnit) => {
  const handledCodes = new Set();
  let changed = 0;
  const deviceFeatures = Array.isArray(device.features) ? device.features : [];
  const temperatureUnit =
    deviceTemperatureUnit || getTemperatureUnitFromLocalDps(device, dps) || getTemperatureUnitFromProperties(device);

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
      ({ transformedValue } = transformFeatureValue(device, deviceFeature, code, rawValue, temperatureUnit));
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

const pollCloudFeatures = async function pollCloudFeatures(device, deviceFeatures, topic, currentTemperatureUnit) {
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

  const cloudStrategy = getConfiguredCloudStrategy(device);
  const response =
    cloudStrategy === CLOUD_STRATEGY.SHADOW
      ? await this.connector.request({
          method: 'GET',
          path: `${API.VERSION_2_0}/thing/${topic}/shadow/properties`,
        })
      : await this.connector.request({
          method: 'GET',
          path: `${API.VERSION_1_0}/devices/${topic}/status`,
        });

  const values =
    cloudStrategy === CLOUD_STRATEGY.SHADOW
      ? extractShadowValues(device, response)
      : extractValuesFromResultArray(device, response && response.result);

  const deviceTemperatureUnit = getTemperatureUnitFromValues(values) || currentTemperatureUnit;

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
    try {
      const { transformedValue } = transformFeatureValue(device, deviceFeature, code, value, deviceTemperatureUnit);
      const { lastValue, lastValueChanged } = getCurrentFeatureState(this.gladys, deviceFeature);
      const { changed } = emitFeatureState(this.gladys, deviceFeature, transformedValue, lastValue, lastValueChanged);
      if (changed) {
        summary.changed += 1;
      }
      summary.handled += 1;
    } catch (e) {
      summary.skipped += 1;
      logger.warn(`[Tuya][poll][cloud] reader failed for device=${topic} code=${code}`, e);
    }
  });
  summary.temperatureUnit = deviceTemperatureUnit;
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
  let deviceTemperatureUnit = getTemperatureUnitFromProperties(device);
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
        deviceTemperatureUnit = getTemperatureUnitFromLocalDps(device, dps) || deviceTemperatureUnit;
        const { handledCodes, changed: localChangedCount } = emitLocalDpsStates(
          this.gladys,
          device,
          dps,
          deviceTemperatureUnit,
        );
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
          cloudSummary = await pollCloudFeatures.call(this, device, pendingCloudFeatures, topic, deviceTemperatureUnit);
          deviceTemperatureUnit = cloudSummary.temperatureUnit || deviceTemperatureUnit;
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
    cloudSummary = await pollCloudFeatures.call(this, device, deviceFeatures, topic, deviceTemperatureUnit);
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
