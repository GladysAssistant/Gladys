const { DEVICE_MODEL_KEYS } = require('./utils/awox.mesh.ble.constants');

/**
 * @description Is the device BLEMesh comptatible?
 * @param {Object} device - Gladys device.
 * @param {Object} manufacturerData - Decoded manufacturer data.
 * @returns {boolean} Is the device compatible?
 * @example
 * bleMesh.isSupportedDevice({ name: 'awox' });
 */
function isSupportedDevice(device, manufacturerData) {
  return DEVICE_MODEL_KEYS.includes(manufacturerData.model);
}

module.exports = {
  isSupportedDevice,
};
