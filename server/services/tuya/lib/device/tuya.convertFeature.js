const logger = require('../../../../utils/logger');
const { mappings, readValues } = require('./tuya.deviceMapping');

/**
 * @description Transforms Tuya feature as Gladys feature.
 * @param {object} tuyaFunctions - Functions from Tuya.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * convertFeature({ code: 'switch', type: 'Boolean', values: '{}' }, 'tuya:device_id');
 */
function convertFeature(tuyaFunctions, externalId) {
  const { code, values, name, readOnly } = tuyaFunctions;

  const featuresCategoryAndType = mappings[code];
  if (!featuresCategoryAndType) {
    logger.warn(`Tuya function with "${code}" code is not managed`);
    return undefined;
  }

  const mappingType = readValues[featuresCategoryAndType.category][featuresCategoryAndType.type];
  if (!mappingType) {
    logger.warn(
      `Tuya function with "${featuresCategoryAndType.category}/${featuresCategoryAndType.type}" type is not managed on "${code}" code`,
    );
    return undefined;
  }

  let valuesObject = {};
  try {
    valuesObject = JSON.parse(values);
  } catch (e) {
    logger.error(
      `Tuya function as unmappable "${values}" values on "${featuresCategoryAndType.category}/${featuresCategoryAndType.type}" type with "${code}" code`,
    );
  }

  const feature = {
    name,
    external_id: `${externalId}:${code}`,
    selector: `${externalId}:${code}`,
    read_only: readOnly,
    has_feedback: false,
    min: 0,
    max: 1,
    ...featuresCategoryAndType,
  };
  if (valuesObject.min) {
    feature.min = valuesObject.min;
  }
  if (valuesObject.max) {
    feature.max = valuesObject.max;
  }

  return feature;
}

module.exports = {
  convertFeature,
};
