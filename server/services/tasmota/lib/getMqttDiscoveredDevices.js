/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @returns {*} Discovered devices.
 * @example
 * getMqttDiscoveredDevices()
 */
function getMqttDiscoveredDevices() {
  const discovered = Object.values(this.mqttDevices).map((d) => {
    return this.mergeWithExistingDevice(d);
  });

  return discovered;
}

module.exports = {
  getMqttDiscoveredDevices,
};
