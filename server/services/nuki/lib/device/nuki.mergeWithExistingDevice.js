const { mergeDevices } = require('../../../../utils/device');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {object} nukiDevice - Discovered device.
 * @returns {object} Device merged with Gladys existing one.
 * @example
 * mergeWithExistingDevice(discoveredDevice)
 */
function mergeWithExistingDevice(nukiDevice) {
  const existing = this.gladys.stateManager.get('deviceByExternalId', nukiDevice.external_id);
  return mergeDevices(nukiDevice, existing);
}

module.exports = {
  mergeWithExistingDevice,
};
