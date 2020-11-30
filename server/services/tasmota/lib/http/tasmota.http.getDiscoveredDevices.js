/**
 * @description Get all discovered devices.
 * @returns {*} Discovered devices.
 * @example
 * getDiscoveredDevices();
 */
function getDiscoveredDevices() {
  return this.discoveredDevices;
}

module.exports = {
  getDiscoveredDevices,
};
