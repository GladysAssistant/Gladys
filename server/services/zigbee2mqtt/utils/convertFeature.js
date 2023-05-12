/**
 * @description Find for a device the feature linked to the zigbeeFeatureField.
 * @param {Array} features - Gladys features of the device.
 * @param {string} zigbeeFeatureField - Zigbee feature field.
 * @param {any} zigbeeFeatureValue - Zigbee feature value.
 * @returns {object} Gladys feature.
 * @example
 * convertFeature(feature);
 */
function convertFeature(features, zigbeeFeatureField, zigbeeFeatureValue) {
  const featureId = parseInt(`${zigbeeFeatureValue}`, 10);
  const expectedFeatureIndex = Number.isNaN(featureId) ? null : `${featureId}`;

  const feature = features.find((deviceFeature) => {
    const [, , , , deviceFeatureZigbeeField = '', featureIndex = null] = deviceFeature.external_id.split(':');
    if (zigbeeFeatureField === deviceFeatureZigbeeField && (!featureIndex || expectedFeatureIndex === featureIndex)) {
      return true;
    }
    return false;
  });
  return feature;
}

module.exports = {
  convertFeature,
};
