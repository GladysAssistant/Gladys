const matchFeature = (device, feature) => {
  return device.features.findIndex((f) => f.external_id === feature.external_id);
};

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @returns {*} Discovered devices.
 * @example
 * getDiscoveredDevices()
 */
function getDiscoveredDevices() {
  const discovered = Object.values(this.mqttDevices).map((d) => {
    const existing = this.gladys.stateManager.get('deviceByExternalId', d.external_id);
    if (existing) {
      const device = { ...existing, ...d };
      const { features } = device;
      const featureLength = features.length;

      device.updatable = existing.features.length !== featureLength;
      let i = 0;
      while (!device.updatable && features[i]) {
        device.updatable = matchFeature(existing, features[i]) < 0;
        i += 1;
      }

      return device;
    }
    return d;
  });

  return discovered;
}

module.exports = {
  getDiscoveredDevices,
};
