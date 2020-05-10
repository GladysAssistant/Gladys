const matchFeature = (device, feature) => {
  return device.features.findIndex((f) => f.external_id === feature.external_id);
};

const matchParam = (device, param) => {
  return device.features.findIndex((p) => p.name === param.name && p.value === param.value);
};

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {Object} tasmotaDevice - Discovered device.
 * @returns {Object} Device merged with Gladys existing one.
 * @example
 * mergeWithExistingDevice(discorveredDevice)
 */
function mergeWithExistingDevice(tasmotaDevice) {
  const existing = this.gladys.stateManager.get('deviceByExternalId', tasmotaDevice.external_id);
  if (existing) {
    const device = { ...existing, ...tasmotaDevice };
    const { features } = device;
    const featureLength = features.length;

    let updatable = existing.features.length !== featureLength;
    let i = 0;
    while (!updatable && features[i]) {
      updatable = matchFeature(existing, features[i]) < 0;
      i += 1;
    }

    const { params } = device;
    i = 0;
    while (!updatable && params[i]) {
      updatable = matchParam(existing, params[i]) < 0;
      i += 1;
    }

    if (updatable) {
      device.updatable = updatable;
    }

    return device;
  }

  return tasmotaDevice;
}

module.exports = {
  mergeWithExistingDevice,
};
