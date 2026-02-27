const { convertFeature } = require('./tuya.convertFeature');
const { getDeviceType, getLocalMapping, normalizeCode } = require('../mappings');

const getLocalDpsFromCode = (code, device) => {
  if (!code) {
    return null;
  }
  const normalized = normalizeCode(code);
  const deviceType = device && device.device_type ? device.device_type : getDeviceType(device);
  const localMapping = getLocalMapping(deviceType);

  if (localMapping.dps && localMapping.dps[normalized] !== undefined) {
    return localMapping.dps[normalized];
  }
  const aliases = localMapping.codeAliases && localMapping.codeAliases[normalized];
  if (Array.isArray(aliases)) {
    const matchedAlias = aliases
      .map((alias) => normalizeCode(alias))
      .find((aliasKey) => aliasKey && localMapping.dps && localMapping.dps[aliasKey] !== undefined);
    if (matchedAlias) {
      return localMapping.dps[matchedAlias];
    }
  }

  if (localMapping.strict) {
    return null;
  }

  if (normalized === 'switch' || normalized === 'power') {
    return 1;
  }
  const match = normalized.match(/_(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

const hasDpsKey = (dps, key) => {
  if (!dps || typeof dps !== 'object') {
    return false;
  }
  const stringKey = String(key);
  return Object.prototype.hasOwnProperty.call(dps, stringKey) || Object.prototype.hasOwnProperty.call(dps, key);
};

const addFallbackBinaryFeature = (device, dps) => {
  if (!device || !device.external_id) {
    return device;
  }
  const hasFeatures = Array.isArray(device.features) && device.features.length > 0;
  if (hasFeatures || !hasDpsKey(dps, 1)) {
    return device;
  }
  const fallbackFeature = convertFeature(
    {
      code: 'switch_1',
      values: '{}',
      name: 'Switch',
      readOnly: false,
    },
    device.external_id,
  );
  if (fallbackFeature) {
    device.features = [fallbackFeature];
  }
  return device;
};

module.exports = {
  addFallbackBinaryFeature,
  getLocalDpsFromCode,
};
