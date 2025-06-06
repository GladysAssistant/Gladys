/**
 * @description Find for a device the feature linked to the zigbeeFeatureField.
 * @param {Array} features - Gladys features of the device.
 * @param {string} featureCode - Zigbee feature field.
 * @param {any} featureValue - Zigbee feature value.
 * @returns {object} Gladys feature.
 * @example
 * convertFeature(feature);
 */
function convertFeature(features, featureCode, featureValue) {
  const feature = features.find((deviceFeature) => {
    const [, , deviceFeatureTuyaField] = deviceFeature.external_id.split(':');
    if (featureCode === deviceFeatureTuyaField) {
      return true;
    }
    return false;
  });
  return feature;
}

module.exports = {
  convertFeature,
};
