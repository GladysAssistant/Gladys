/**
 * @description Find for a device the feature linked to the zigbeeFeatureField.
 * @param {Array} features - Gladys features of the device.
 * @param {string} zigbeeFeatureField - Zigbee feature field.
 * @returns {Object} Gladys feature.
 * @example
 * convertFeature(feature);
 */
function convertFeature(features, zigbeeFeatureField) {
  const feature = features.find((deviceFeature) => {
    const deviceFeatureZigbeeField = deviceFeature.external_id.split(':').slice(-1)[0];
    if (zigbeeFeatureField === deviceFeatureZigbeeField) {
      return true;
    }
    return false;
  });
  return feature;
}

module.exports = {
  convertFeature,
};
