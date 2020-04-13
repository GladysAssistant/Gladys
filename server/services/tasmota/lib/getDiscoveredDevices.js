/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @returns {*} Discovered devices.
 * @example
 * getDiscoveredDevices()
 */
function getDiscoveredDevices() {
  const discovered = Object.values(this.mqttDevices).map((d) => {
    return this.mergeWithExistingDevice(d);
  });

  return discovered;
}

module.exports = {
  getDiscoveredDevices,
};
