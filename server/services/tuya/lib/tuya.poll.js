const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { readValues } = require('./device/tuya.deviceMapping');
const { API, DEVICE_PARAM_NAME, STATUS } = require('./utils/tuya.constants');
const { EVENTS, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');
const { normalizeBoolean } = require('./utils/tuya.normalize');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { localPoll } = require('./tuya.localPoll');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');
const { getDeviceType, getLocalMapping } = require('./mappings');

const emitFeatureState = (gladys, deviceFeature, transformedValue) => {
  if (deviceFeature.last_value !== transformedValue) {
    if (transformedValue !== null && transformedValue !== undefined) {
      gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: deviceFeature.external_id,
        state: transformedValue,
      });
    }
  }
};

const normalizeTemperatureUnit = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).toLowerCase();
  if (normalized === 'c' || normalized === '℃' || normalized === DEVICE_FEATURE_UNITS.CELSIUS) {
    return DEVICE_FEATURE_UNITS.CELSIUS;
  }
  if (normalized === 'f' || normalized === '℉' || normalized === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
    return DEVICE_FEATURE_UNITS.FAHRENHEIT;
  }
  return null;
};

const isTemperatureFeature = (deviceFeature, code) => {
  if (!deviceFeature || !code) {
    return false;
  }
  if (deviceFeature.unit !== DEVICE_FEATURE_UNITS.CELSIUS && deviceFeature.unit !== DEVICE_FEATURE_UNITS.FAHRENHEIT) {
    return false;
  }
  return code === 'temp_set' || code === 'temp_current';
};

const roundTemperatureValue = (value, code) => {
  if (!Number.isFinite(value)) {
    return value;
  }
  if (code === 'temp_set') {
    return Math.round(value);
  }
  if (code === 'temp_current') {
    return Math.round(value * 10) / 10;
  }
  return value;
};

const convertTemperatureValue = (value, fromUnit, toUnit, deviceFeature, code) => {
  if (value === null || value === undefined) {
    return value;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || !fromUnit || !toUnit || fromUnit === toUnit) {
    return value;
  }
  let convertedValue = numericValue;
  if (fromUnit === DEVICE_FEATURE_UNITS.CELSIUS && toUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
    convertedValue = celsiusToFahrenheit(numericValue);
  }
  if (fromUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT && toUnit === DEVICE_FEATURE_UNITS.CELSIUS) {
    convertedValue = fahrenheitToCelsius(numericValue);
  }
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
  const rawValue = dps[unitProperty.dp_id];
  return normalizeTemperatureUnit(rawValue);
};

const getTemperatureUnitFromValues = (values) => {
  if (!values) {
    return null;
  }
  return normalizeTemperatureUnit(values.temp_unit_convert || values.unit);
};

const upsertLocalParam = (params, name, value) => {
  if (!Array.isArray(params)) {
    return;
  }
  const index = params.findIndex((param) => param.name === name);
  if (index >= 0) {
    params[index] = { ...params[index], value };
  } else {
    params.push({ name, value });
  }
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
  const ipAddress = getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS);
  const localKey = getParamValue(params, DEVICE_PARAM_NAME.LOCAL_KEY);
  const protocolVersion = getParamValue(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const localOverride = normalizeBoolean(getParamValue(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE));
  const hasLocalConfig = ipAddress && localKey && protocolVersion && localOverride === true;
  let deviceTemperatureUnit = normalizeTemperatureUnit(getParamValue(params, DEVICE_PARAM_NAME.TEMPERATURE_UNIT));

  if (hasLocalConfig) {
    const deviceType = getDeviceType(device);
    const localMapping = getLocalMapping(deviceType);
    const isLocalStrict = localMapping.strict === true;
    const localResult = await localPoll({
      deviceId: topic,
      ip: ipAddress,
      localKey,
      protocolVersion,
      timeoutMs: 3000,
      fastScan: true,
    });
    const dps = localResult && localResult.dps ? localResult.dps : {};
    const reportedUnit = getTemperatureUnitFromLocalDps(device, dps);
    if (reportedUnit && reportedUnit !== deviceTemperatureUnit && this.gladys && this.gladys.device) {
      deviceTemperatureUnit = reportedUnit;
      upsertLocalParam(params, DEVICE_PARAM_NAME.TEMPERATURE_UNIT, reportedUnit);
      try {
        await this.gladys.device.setParam(device, DEVICE_PARAM_NAME.TEMPERATURE_UNIT, reportedUnit);
      } catch (e) {
        logger.warn(`[Tuya][poll] unable to persist temperature unit for ${topic}`, e);
      }
    }
    const pendingFeatures = [];
    device.features.forEach((deviceFeature) => {
      const [, , code] = deviceFeature.external_id.split(':');
      const dpsKey = getLocalDpsFromCode(code, device);
      if (dpsKey === null || !(dpsKey in dps)) {
        pendingFeatures.push(deviceFeature);
        return;
      }
      const reader = readValues[deviceFeature.category] && readValues[deviceFeature.category][deviceFeature.type];
      if (!reader) {
        pendingFeatures.push(deviceFeature);
        return;
      }
      let transformedValue = reader(dps[dpsKey], deviceFeature);
      if (isTemperatureFeature(deviceFeature, code)) {
        transformedValue = convertTemperatureValue(
          transformedValue,
          deviceTemperatureUnit,
          deviceFeature.unit,
          deviceFeature,
          code,
        );
      }
      emitFeatureState(this.gladys, deviceFeature, transformedValue);
    });

    if (pendingFeatures.length === 0 || this.status !== STATUS.CONNECTED || isLocalStrict) {
      return;
    }

    const response = await this.connector.request({
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/${topic}/status`,
    });

    const values = {};
    (response.result || []).forEach((feature) => {
      values[feature.code] = feature.value;
    });
    const cloudUnit = getTemperatureUnitFromValues(values);
    if (cloudUnit && cloudUnit !== deviceTemperatureUnit && this.gladys && this.gladys.device) {
      deviceTemperatureUnit = cloudUnit;
      upsertLocalParam(params, DEVICE_PARAM_NAME.TEMPERATURE_UNIT, cloudUnit);
      try {
        await this.gladys.device.setParam(device, DEVICE_PARAM_NAME.TEMPERATURE_UNIT, cloudUnit);
      } catch (e) {
        logger.warn(`[Tuya][poll] unable to persist temperature unit for ${topic}`, e);
      }
    }

    pendingFeatures.forEach((deviceFeature) => {
      const [, , code] = deviceFeature.external_id.split(':');
      const value = values[code];
      const reader = readValues[deviceFeature.category] && readValues[deviceFeature.category][deviceFeature.type];
      if (!reader) {
        return;
      }
      let transformedValue = reader(value, deviceFeature);
      if (isTemperatureFeature(deviceFeature, code)) {
        transformedValue = convertTemperatureValue(
          transformedValue,
          deviceTemperatureUnit,
          deviceFeature.unit,
          deviceFeature,
          code,
        );
      }
      emitFeatureState(this.gladys, deviceFeature, transformedValue);
    });

    return;
  }

  if (this.status !== STATUS.CONNECTED) {
    logger.debug(`[Tuya][poll] Skip cloud poll for ${topic} (service not connected).`);
    return;
  }

  const response = await this.connector.request({
    method: 'GET',
    path: `${API.VERSION_1_0}/devices/${topic}/status`,
  });

  const values = {};
  (response.result || []).forEach((feature) => {
    values[feature.code] = feature.value;
  });
  const cloudUnit = getTemperatureUnitFromValues(values);
  if (cloudUnit && cloudUnit !== deviceTemperatureUnit && this.gladys && this.gladys.device) {
    deviceTemperatureUnit = cloudUnit;
    upsertLocalParam(params, DEVICE_PARAM_NAME.TEMPERATURE_UNIT, cloudUnit);
    try {
      await this.gladys.device.setParam(device, DEVICE_PARAM_NAME.TEMPERATURE_UNIT, cloudUnit);
    } catch (e) {
      logger.warn(`[Tuya][poll] unable to persist temperature unit for ${topic}`, e);
    }
  }

  device.features.forEach((deviceFeature) => {
    const [, , code] = deviceFeature.external_id.split(':');

    const value = values[code];
    const reader = readValues[deviceFeature.category] && readValues[deviceFeature.category][deviceFeature.type];
    if (!reader) {
      return;
    }
    let transformedValue = reader(value, deviceFeature);
    if (isTemperatureFeature(deviceFeature, code)) {
      transformedValue = convertTemperatureValue(
        transformedValue,
        deviceTemperatureUnit,
        deviceFeature.unit,
        deviceFeature,
        code,
      );
    }

    emitFeatureState(this.gladys, deviceFeature, transformedValue);
  });
}

module.exports = {
  poll,
};
