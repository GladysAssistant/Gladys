/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {string} protocol - Protocol to filter devices.
 * @returns {*} Discovered devices.
 * @example
 * getDiscoveredDevices()
 */
function getDiscoveredDevices(protocol) {
  const handlerDevices = this.getHandler(protocol).getDiscoveredDevices();
  return Object.values(handlerDevices).map((d) => this.mergeWithExistingDevice(d));
}

module.exports = {
  getDiscoveredDevices,
};
