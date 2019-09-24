/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @returns {*} Discovered devices.
 * @example
 * getDiscoveredDevices()
 */
function getDiscoveredDevices() {
  const discovered = Object.values(this.mqttDevices).map((d) => {
    const existing = this.gladys.stateManager.get('deviceByExternalId', d.external_id);
    return existing || d;
  });

  return discovered;
}

module.exports = {
  getDiscoveredDevices,
};
