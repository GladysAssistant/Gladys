/**
 * @description Get all found preipherals as devices.
 * @returns {Object} Return list of devices.
 * @example
 * const devices = bluetoothManager.getDiscoveredDevices();
 */
function getDiscoveredDevices() {
  return Object.values(this.discoveredDevices);
}

module.exports = {
  getDiscoveredDevices,
};
