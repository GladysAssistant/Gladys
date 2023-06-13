/**
 * @description Return asked Peripheral, or undefined.
 * @param {string} uuid - Wanted peripheral UUID.
 * @returns {object} Returns peripheral according to this UUID.
 * @example
 * const device = bluetoothManager.getDiscoveredDevice('99dd77cba4');
 */
function getDiscoveredDevice(uuid) {
  return this.completeDevice(this.discoveredDevices[uuid]);
}

module.exports = {
  getDiscoveredDevice,
};
