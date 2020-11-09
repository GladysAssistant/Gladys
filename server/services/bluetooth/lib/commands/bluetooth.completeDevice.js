/**
 * @description Complete device with Gladys exting information.
 * @param {Object} device - Device to check.
 * @returns {Object} Returns completed device.
 * @example
 * const device = bluetoothManager.completeDevice({});
 */
function completeDevice(device) {
  if (!device) {
    return null;
  }

  const existing = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
  if (!existing) {
    return device;
  }
  return { ...existing, ...device };
}

module.exports = {
  completeDevice,
};
