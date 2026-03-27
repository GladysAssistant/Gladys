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

const getSupportedCodes = (entries, deviceType, ignoredCloudCodes) =>
  new Set(
    entries
      .filter((entry) => isSupportedCloudCode(entry && entry.code, deviceType, ignoredCloudCodes))
      .map((entry) => normalizeCode(entry && entry.code)),
  );

const resolveCloudStrategy = (device, deviceType) => {
  const ignoredCloudCodes = getIgnoredCloudCodes(deviceType);
  const functions = Array.isArray(device && device.specifications && device.specifications.functions)
    ? device.specifications.functions
    : [];
  const status = Array.isArray(device && device.specifications && device.specifications.status)
    ? device.specifications.status
    : [];
  const thingProperties = getThingModelProperties(device);
  const legacyCodes = getSupportedCodes([...functions, ...status], deviceType, ignoredCloudCodes);
  const shadowCodes = getSupportedCodes(thingProperties, deviceType, ignoredCloudCodes);

  if (shadowCodes.size > 0 && [...shadowCodes].some((code) => !legacyCodes.has(code))) {
    return CLOUD_STRATEGY.SHADOW;
  }
  if (legacyCodes.size > 0) {
    return CLOUD_STRATEGY.LEGACY;
  }
  return shadowCodes.size > 0 ? CLOUD_STRATEGY.SHADOW : null;
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
