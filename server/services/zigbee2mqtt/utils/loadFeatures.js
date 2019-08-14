const uuid = require('uuid');
const { features } = require('./features');
const { getFeaturesByModel } = require('../model');

/**
 * @description Retreive feature related to device.
 * @param {string} name - Device name.
 * @param {string} model - Device model.
 * @param {boolean} addBattery - Add battery feature.
 * @returns {*} Device for Gladys.
 * @example
 * loadFeatures('MODEL', true);
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
    feature.id = uuid.v4();
    feature.external_id = `${name}:${feature.category.split('-')[0]}`;
  });

  return loadedFeatures;
}

module.exports = {
  loadFeatures,
};
