const { features } = require('./features');
const models = require('../model');

/**
 * @description Get features by model name.
 * @param {string} modelName - Model name to find.
 * @returns {Array} Related features.
 * @example
 * getFeaturesByModel('1TST-EU');
 */
function getFeaturesByModel(modelName) {
  const model = models.find((m) => {
    return m.models[modelName];
  });

  if (model) {
    return model.models[modelName];
  }

  return [];
}

/**
 * @description Retreive feature related to device.
 * @param {string} name - Device name.
 * @param {string} model - Device model.
 * @param {boolean} addBattery - Automatically add battery feature.
 * @returns {Object} Device for Gladys.
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
    feature.external_id = `zigbee2mqtt:${name}:${feature.category}:${feature.type}:${feature.zigbeeField}`;
    feature.selector = feature.external_id;
  });

  return loadedFeatures;
}

module.exports = {
  loadFeatures,
};
