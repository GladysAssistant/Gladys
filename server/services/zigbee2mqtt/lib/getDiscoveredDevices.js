/**
 * @description Get discovered devices.
 * @returns {Array} Array of discovered devices.
 * @example
 * getDiscoveredDevices();
 */
function getDiscoveredDevices() {
  return this.discoveredDevices;
}

module.exports = {
  getDiscoveredDevices,
};
