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
      .find((aliasCode) => aliasCode && localMapping.dps && localMapping.dps[aliasCode] !== undefined);

    if (matchedAlias) {
      return localMapping.dps[matchedAlias];
    }
  }

  if (localMapping.strict) {
    return null;
  }

  // Generic fallback for devices without a dedicated local mapping: most
  // Tuya switch/socket devices expose `switch`/`power` on DPS 1 and
  // `switch_N` (e.g. `switch_2`) on DPS N. This is a read-only inference
  // used to bootstrap unsupported devices in local mode; dedicated device
  // types should opt out by setting `strict: true` in their local mapping.
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
    {
      deviceType: device.device_type,
    },
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
