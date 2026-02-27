const { DEVICE_PARAM_NAME } = require('./tuya.constants');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const { normalizeBoolean } = require('./tuya.normalize');

const upsertParam = (params, name, value) => {
  if (value === undefined || value === null) {
    return;
  }
  const index = params.findIndex((param) => param.name === name);
  if (index >= 0) {
    params[index] = { ...params[index], value };
  } else {
    params.push({ name, value });
  }
};

const normalizeExistingDevice = (device) => {
  if (!device || !Array.isArray(device.params)) {
    return device;
  }
  const normalizedParams = device.params.map((param) => {
    if (param.name !== DEVICE_PARAM_NAME.LOCAL_OVERRIDE) {
      return param;
    }
    if (param.value === undefined || param.value === null) {
      return param;
    }
    return { ...param, value: normalizeBoolean(param.value) };
  });
  return { ...device, params: normalizedParams };
};

const updateDiscoveredDeviceWithLocalInfo = (device, localInfo) => {
  if (!device || !localInfo) {
    return device;
  }
  const updated = { ...device };
  if (localInfo.version !== undefined && localInfo.version !== null) {
    updated.protocol_version = localInfo.version;
  }
  updated.ip = localInfo.ip || updated.ip;
  if (localInfo.productKey !== undefined && localInfo.productKey !== null) {
    updated.product_key = localInfo.productKey;
  }
  updated.params = Array.isArray(updated.params) ? [...updated.params] : [];
  upsertParam(updated.params, DEVICE_PARAM_NAME.IP_ADDRESS, updated.ip);
  upsertParam(updated.params, DEVICE_PARAM_NAME.PROTOCOL_VERSION, updated.protocol_version);
  upsertParam(updated.params, DEVICE_PARAM_NAME.PRODUCT_KEY, updated.product_key);
  return updated;
};

const getParamValue = (params, name) => {
  if (!Array.isArray(params)) {
    return undefined;
  }
  const found = params.find((param) => param.name === name);
  return found ? found.value : undefined;
};

const getExistingParamValue = (existingDevice, name) => getParamValue(existingDevice && existingDevice.params, name);

const applyExistingLocalParams = (device, existingDevice) => {
  if (!existingDevice) {
    return device;
  }
  const params = Array.isArray(device.params) ? [...device.params] : [];
  const ipValue = getExistingParamValue(existingDevice, DEVICE_PARAM_NAME.IP_ADDRESS);
  const protocolValue = getExistingParamValue(existingDevice, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const localPollDpsValue = getExistingParamValue(existingDevice, DEVICE_PARAM_NAME.LOCAL_POLL_DPS);
  const temperatureUnitValue = getExistingParamValue(existingDevice, DEVICE_PARAM_NAME.TEMPERATURE_UNIT);
  const rawLocalOverrideValue = getExistingParamValue(existingDevice, DEVICE_PARAM_NAME.LOCAL_OVERRIDE);
  const localOverrideValue =
    rawLocalOverrideValue !== undefined && rawLocalOverrideValue !== null
      ? normalizeBoolean(rawLocalOverrideValue)
      : rawLocalOverrideValue;

  upsertParam(params, DEVICE_PARAM_NAME.IP_ADDRESS, ipValue);
  upsertParam(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION, protocolValue);
  upsertParam(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE, localOverrideValue);
  upsertParam(params, DEVICE_PARAM_NAME.LOCAL_POLL_DPS, localPollDpsValue);
  upsertParam(params, DEVICE_PARAM_NAME.TEMPERATURE_UNIT, temperatureUnitValue);

  return {
    ...device,
    params,
    ip: ipValue !== undefined && ipValue !== null ? ipValue : device.ip,
    protocol_version: protocolValue !== undefined && protocolValue !== null ? protocolValue : device.protocol_version,
    local_override:
      localOverrideValue !== undefined && localOverrideValue !== null ? localOverrideValue : device.local_override,
  };
};

const applyExistingLocalOverride = (device, existingDevice) => {
  if (!existingDevice || !Array.isArray(existingDevice.params)) {
    return device;
  }
  const overrideParam = existingDevice.params.find((param) => param.name === DEVICE_PARAM_NAME.LOCAL_OVERRIDE);
  if (!overrideParam || overrideParam.value === undefined || overrideParam.value === null) {
    return device;
  }
  const updated = { ...device };
  updated.params = Array.isArray(updated.params) ? [...updated.params] : [];
  const normalizedOverride = normalizeBoolean(overrideParam.value);
  upsertParam(updated.params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE, normalizedOverride);
  updated.local_override = normalizedOverride;
  return updated;
};

const isTemperatureUnit = (unit) => unit === DEVICE_FEATURE_UNITS.CELSIUS || unit === DEVICE_FEATURE_UNITS.FAHRENHEIT;

const isTemperatureFeature = (feature) => {
  return (
    (feature.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING &&
      feature.type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE) ||
    (feature.category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR &&
      feature.type === DEVICE_FEATURE_TYPES.SENSOR.DECIMAL)
  );
};

const applyExistingFeatureUnits = (device, existingDevice) => {
  if (!device || !Array.isArray(device.features) || !existingDevice || !Array.isArray(existingDevice.features)) {
    return device;
  }
  const existingByExternalId = new Map(
    existingDevice.features
      .filter((feature) => feature && feature.external_id)
      .map((feature) => [feature.external_id, feature]),
  );
  const updatedFeatures = device.features.map((feature) => {
    if (!feature || !feature.external_id) {
      return feature;
    }
    const existingFeature = existingByExternalId.get(feature.external_id);
    if (!existingFeature) {
      return feature;
    }
    if (
      isTemperatureFeature(feature) &&
      isTemperatureFeature(existingFeature) &&
      isTemperatureUnit(feature.unit) &&
      isTemperatureUnit(existingFeature.unit)
    ) {
      return { ...feature, unit: existingFeature.unit };
    }
    return feature;
  });
  return { ...device, features: updatedFeatures };
};

module.exports = {
  applyExistingLocalOverride,
  applyExistingLocalParams,
  applyExistingFeatureUnits,
  getParamValue,
  normalizeExistingDevice,
  updateDiscoveredDeviceWithLocalInfo,
  upsertParam,
};
