const { hasDeviceChanged } = require('../../../utils/device');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {Object} tasmotaDevice - Discovered device.
 * @returns {Object} Device merged with Gladys existing one.
 * @example
 * mergeWithExistingDevice(discorveredDevice)
 */
function mergeWithExistingDevice(tasmotaDevice) {
  const existing = this.gladys.stateManager.get('deviceByExternalId', tasmotaDevice.external_id);
  if (existing) {
    const device = { ...existing, ...tasmotaDevice };
    const updatable = hasDeviceChanged(device, existing);
    if (updatable) {
      device.updatable = updatable;
    }

    return device;
  }

  return tasmotaDevice;
}

module.exports = {
  mergeWithExistingDevice,
};
