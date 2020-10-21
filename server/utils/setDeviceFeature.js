/**
 * @description Add or update a param to a device.
 * @param {Object} device - Device to add parameter.
 * @param {Object} feature - The feature to add.
 * @returns {Object} The device.
 * @example
 * setDeviceParam({ features: [] }, { selector: 'feature' })
 */
function setDeviceFeature(device, feature) {
  let { features } = device;
  if (!features) {
    features = [];
    device.features = features;
  }

  const featureIndex = features.findIndex((p) => p.selector === feature.selector);
  if (featureIndex >= 0) {
    features[featureIndex] = feature;
  } else {
    features.push(feature);
  }

  return device;
}

module.exports = {
  setDeviceFeature,
};
