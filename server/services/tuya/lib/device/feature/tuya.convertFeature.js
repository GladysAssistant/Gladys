const logger = require('../../../../../utils/logger');
const types = require('./type');

/**
 * @description Trasnforms Tuya feature as Gadlsy feature.
 * @param {Object} tuyaFunctions - Functions from Tuya.
 * @returns {Object} Gladys feature or undefined.
 * @example
 * convertFeature({ code: 'switch', type: 'Boolean', values: '{}' });
 */
function convertFeature(tuyaFunctions) {
  const { code, type, valuesAsString } = tuyaFunctions;
  const mappingType = types[type];

  if (mappingType === undefined) {
    logger.warn(`Tuya function with "${type}" type is not managed on "${code}" code`);
    return undefined;
  }

  let values = {};
  try {
    values = JSON.parse(valuesAsString);
  } catch (e) {
    logger.error(`Tuya function as unmappable "${valuesAsString}" values on "${type}" type with "${code}" code`);
  }

  // TODO feature has only min/max/unit
  return mappingType.getFeatureAttributes(values);
}

module.exports = {
  convertFeature,
};
