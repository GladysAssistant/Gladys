const { DEVICE_PARAM_NAME } = require('./tuya.constants');
const { getParamValue } = require('./tuya.deviceParams');
const { getFeatureMapping, getIgnoredCloudCodes, normalizeCode } = require('../mappings');

const CLOUD_STRATEGY = {
  LEGACY: 'legacy',
  SHADOW: 'shadow',
};

const isSupportedCloudCode = (code, deviceType, ignoredCloudCodes) => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    return false;
  }
  if (ignoredCloudCodes.includes(normalizedCode)) {
    return false;
  }
  return Boolean(getFeatureMapping(normalizedCode, deviceType));
};

const getThingModelProperties = (device) => {
  if (!device || !device.thing_model || !Array.isArray(device.thing_model.services)) {
    return [];
  }
  return device.thing_model.services.flatMap((service) =>
    Array.isArray(service && service.properties) ? service.properties : [],
  );
};

const resolveCloudStrategy = (device, deviceType) => {
  const ignoredCloudCodes = getIgnoredCloudCodes(deviceType);
  const functions = Array.isArray(device && device.specifications && device.specifications.functions)
    ? device.specifications.functions
    : [];
  const status = Array.isArray(device && device.specifications && device.specifications.status)
    ? device.specifications.status
    : [];
  if (
    functions.some((entry) => isSupportedCloudCode(entry && entry.code, deviceType, ignoredCloudCodes)) ||
    status.some((entry) => isSupportedCloudCode(entry && entry.code, deviceType, ignoredCloudCodes))
  ) {
    return CLOUD_STRATEGY.LEGACY;
  }
  const thingProperties = getThingModelProperties(device);
  if (thingProperties.some((entry) => entry && isSupportedCloudCode(entry.code, deviceType, ignoredCloudCodes))) {
    return CLOUD_STRATEGY.SHADOW;
  }
  return null;
};

const normalizeCloudStrategy = (value) =>
  value === CLOUD_STRATEGY.SHADOW ? CLOUD_STRATEGY.SHADOW : CLOUD_STRATEGY.LEGACY;

const getConfiguredCloudStrategy = (device) =>
  normalizeCloudStrategy(getParamValue(device && device.params, DEVICE_PARAM_NAME.CLOUD_STRATEGY));

module.exports = {
  CLOUD_STRATEGY,
  getConfiguredCloudStrategy,
  resolveCloudStrategy,
};
