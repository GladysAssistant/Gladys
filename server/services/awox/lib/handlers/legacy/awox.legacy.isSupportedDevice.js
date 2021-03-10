const { DEVICE_MODEL_KEYS } = require('./utils/awox.legacy.constants');

/**
 * @description Is the device legacy compatible?
 * @param {Object} device - Gladys device.
 * @returns {boolean} Is the device compatible?
 * @example
 * legacy.isSupportedDevice({ name: 'awox' });
 */
function isSupportedDevice(device) {
  const { model, name } = device;
  const key = model || name || '';
  return DEVICE_MODEL_KEYS.includes(key);
}

module.exports = {
  isSupportedDevice,
};
