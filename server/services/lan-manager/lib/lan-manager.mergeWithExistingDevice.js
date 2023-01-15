/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {Object} lanDevice - Discovered device.
 * @returns {Object} Device merged with Gladys existing one.
 * @example
 * const mergedDevice = lanManager.mergeWithExistingDevice(discorveredDevice)
 */
function mergeWithExistingDevice(lanDevice) {
  const existing = this.gladys.stateManager.get('deviceByExternalId', lanDevice.external_id);
  return existing || lanDevice;
}

module.exports = {
  mergeWithExistingDevice,
};
