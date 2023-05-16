const logger = require('../../../../../utils/logger');
const types = require('./type');
const { CATEGORY_AND_TYPE_BY_CODE } = require('./tuya.categoryAndTypeMapping');

/**
 * @description Trasnforms Tuya feature as Gadlsy feature.
 * @param {object} tuyaFunctions - Functions from Tuya.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * convertFeature({ code: 'switch', type: 'Boolean', values: '{}' }, 'tuya:device_id');
 */
function convertFeature(tuyaFunctions, externalId) {
  const { code, type, valuesAsString, name, readOnly } = tuyaFunctions;

  const featuresCategoryAndType = CATEGORY_AND_TYPE_BY_CODE[code];
  if (!featuresCategoryAndType) {
    logger.warn(`Tuya function with "${code}" code is not managed`);
    return undefined;
  }

  const mappingType = types[type];
  if (!mappingType) {
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
  const featureAttributes = mappingType.getFeatureAttributes(values);

  return {
    name,
    external_id: `${externalId}:${code}`,
    selector: `${externalId}:${code}`,
    read_only: readOnly,
    has_feedback: false,
    ...featuresCategoryAndType,
    ...featureAttributes,
  };
}

module.exports = {
  convertFeature,
};
