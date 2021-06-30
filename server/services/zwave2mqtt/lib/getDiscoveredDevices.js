/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @returns {*} Discovered devices.
 * @example getDiscoveredDevices()
 */
async function getDiscoveredDevices() {
  return Object.values(this.nodes)
    .map((d) => this.mergeWithExistingDevice(d));
}

module.exports = {
  getDiscoveredDevices,
};
