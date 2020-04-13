const matchFeature = (device, feature) => {
  return device.features.findIndex((f) => f.external_id === feature.external_id);
};

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {Object} mqttDevice - Discovered device.
 * @returns {Object} Device merged with Gladys existing one.
 * @example
 * mergeWithExistingDevice(discorveredDevice)
 */
function mergeWithExistingDevice(mqttDevice) {
  const existing = this.gladys.stateManager.get('deviceByExternalId', mqttDevice.external_id);
  if (existing) {
    const device = { ...existing, ...mqttDevice };
    const { features } = device;
    const featureLength = features.length;

    let updatable = existing.features.length !== featureLength;
    let i = 0;
    while (!updatable && features[i]) {
      updatable = matchFeature(existing, features[i]) < 0;
      i += 1;
    }

    if (updatable) {
      device.updatable = updatable;
    }

    return device;
  }

  return mqttDevice;
}

module.exports = {
  mergeWithExistingDevice,
};
