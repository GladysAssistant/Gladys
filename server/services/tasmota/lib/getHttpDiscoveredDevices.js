/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @returns {*} Discovered devices.
 * @example
 * getHttpDiscoveredDevices()
 */
function getHttpDiscoveredDevices() {
  const discovered = Object.values(this.httpDevices).map((d) => {
    return this.mergeWithExistingDevice(d);
  });

  return discovered;
}

module.exports = {
  getHttpDiscoveredDevices,
};
