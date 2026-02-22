const { convertFeature } = require('./tuya.convertFeature');

const getLocalDpsFromCode = (code) => {
  if (!code) {
    return null;
  }
  const normalized = code.toLowerCase();
  if (normalized === 'switch' || normalized === 'power') {
    return 1;
  }
  const match = code.match(/_(\d+)$/);
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
