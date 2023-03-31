const { mergeDevices } = require('../../../utils/device');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {Object} tasmotaDevice - Discovered device.
 * @returns {Object} Device merged with Gladys existing one.
 * @example
 * mergeWithExistingDevice(discorveredDevice)
 */
function mergeWithExistingDevice(tasmotaDevice) {
  const existing = this.gladys.stateManager.get('deviceByExternalId', tasmotaDevice.external_id);
  return mergeDevices(tasmotaDevice, existing);
}

module.exports = {
  mergeWithExistingDevice,
};
