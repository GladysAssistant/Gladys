const models = {};
// models['345-83-2'] = require('./345-83-2').Device;

/**
 * @description Get features by model name.
 * @param {string} modelName - Model name to find.
 * @returns {Array} Related features.
 * @example getFeaturesByModel('345-83-2');
 */
function getFeaturesByModel(modelName) {
  return models[modelName] ? models[modelName].features : [];
}

module.exports = {
  getFeaturesByModel,
};
