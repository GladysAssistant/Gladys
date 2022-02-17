const { addSelector } = require('../../../../utils/addSelector');

/**
 * @description Complete feature with externalId and selector generated values.
 *
 * @param {string} deviceName - Zigbee friendly device name.
 * @param {Object} feature - Related Gladys feature.
 * @param {string} property - Related Zigbee property.
 * @returns {Object} Completed Galdys feature.
 *
 * @example completeFeature('MyDevice', { category: 'light', type: 'binary' }, 'state');
 */
function completeFeature(deviceName, feature, property) {
  const { category, type } = feature;
  const externalId = `zigbee2mqtt:${deviceName}:${category}:${type}:${property}`;
  const name = `${property.charAt(0).toUpperCase() + property.slice(1).replace(/_/g, ' ')}`;
  const completedFeature = { name, ...feature, external_id: externalId, selector: externalId };
  addSelector(completedFeature);
  return completedFeature;
}

module.exports = {
  completeFeature,
};
