/**
 * @description Get all discovered devices.
 * @returns {*} Discovered devices.
 * @example
 * nukiMQTTHandler.getDiscoveredDevices();
 */
function getDiscoveredDevices() {
  return this.discoveredDevices;
}

module.exports = {
  getDiscoveredDevices,
};
