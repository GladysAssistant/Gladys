/**
 * @description Get all found preipherals as devices.
 * @returns {object} Return list of devices.
 * @example
 * const devices = bluetoothManager.getDiscoveredDevices();
 */
function getDiscoveredDevices() {
  return Object.values(this.discoveredDevices).map((device) => this.completeDevice(device));
}

module.exports = {
  getDiscoveredDevices,
};
