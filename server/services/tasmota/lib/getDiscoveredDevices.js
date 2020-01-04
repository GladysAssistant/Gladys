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
      const device = { ...existing };
      if (device.model !== d.model) {
        device.updatable = true;
        device.model = d.model;

        // Filter for features
        device.features = d.features.map((feature) => {
          const matchingFeature = existing.features.find((f) => f.external_id === feature.external_id);

          if (!matchingFeature) {
            return feature;
          }

          return matchingFeature;
        });
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
