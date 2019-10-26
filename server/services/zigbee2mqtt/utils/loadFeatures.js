const { features } = require('./features');
const { convertCategory } = require('./convertCategory');
const { getFeaturesByModel } = require('../model');

/**
 * @description Retreive feature related to device.
 * @param {string} name - Device name.
 * @param {string} model - Device model.
 * @param {boolean} addBattery - Add battery feature.
 * @returns {*} Device for Gladys.
 * @example
 * loadFeatures('MyDevice', 'MODEL', true);
 */
function loadFeatures(name, model, addBattery) {
  const matchingFeatures = getFeaturesByModel(model);
  const loadedFeatures = matchingFeatures.map((f) => {
    return Object.assign({}, f);
  });

  if (addBattery) {
    loadedFeatures.push(Object.assign({}, features.battery));
  }

  loadedFeatures.forEach((feature) => {
    feature.external_id = `zigbee2mqtt:${name}:${convertCategory(feature)}`;
    feature.selector = feature.external_id;
  });

  return loadedFeatures;
}

module.exports = {
  loadFeatures,
};
