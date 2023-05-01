const { addSelector } = require('../../../../utils/addSelector');

/**
 * @description Complete feature with externalId and selector generated values.
 * @param {string} deviceName - Zigbee friendly device name.
 * @param {object} feature - Related Gladys feature.
 * @param {string} property - Related Zigbee property.
 * @param {number} suffixIndex - Related Zigbee sub-feature index.
 * @returns {object} Completed Galdys feature.
 * @example completeFeature('MyDevice', { category: 'light', type: 'binary' }, 'state');
 */
function completeFeature(deviceName, feature, property, suffixIndex = 0) {
  const { category, type } = feature;

  const externalIdSuffix = suffixIndex > 0 ? `:${suffixIndex}` : '';
  const externalId = `zigbee2mqtt:${deviceName}:${category}:${type}:${property}${externalIdSuffix}`;

  const nameSuffix = suffixIndex > 0 ? ` ${suffixIndex}` : '';
  const name = `${property.charAt(0).toUpperCase() + property.slice(1).replace(/_/g, ' ')}${nameSuffix}`;

  const completedFeature = { name, ...feature, external_id: externalId, selector: externalId };
  addSelector(completedFeature);
  return completedFeature;
}

module.exports = {
  completeFeature,
};
