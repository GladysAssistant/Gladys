const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { getFeatureMapping, getIgnoredCloudCodes, normalizeCode } = require('../mappings');

/**
 * @description Transforms Tuya feature as Gladys feature.
 * @param {object} tuyaFunctions - Functions from Tuya.
 * @param {string} externalId - Gladys external ID.
 * @param {object} options - Mapping options.
 * @returns {object} Gladys feature or undefined.
 * @example
 * convertFeature({ code: 'switch', type: 'Boolean', values: '{}' }, 'tuya:device_id');
 */
function convertFeature(tuyaFunctions, externalId, options = {}) {
  const { code, values, name, readOnly } = tuyaFunctions;
  const { deviceType, ignoredCloudCodes, temperatureUnit } = options;

  const codeLower = normalizeCode(code);
  const ignoredCodes = Array.isArray(ignoredCloudCodes) ? ignoredCloudCodes : getIgnoredCloudCodes(deviceType);
  if (codeLower && ignoredCodes.includes(codeLower)) {
    return undefined;
  }

  const featuresCategoryAndType = getFeatureMapping(code, deviceType);
  if (!featuresCategoryAndType) {
    logger.warn(`Tuya function with "${code}" code is not managed`);
    return undefined;
  }

  let valuesObject = {};
  if (values && typeof values === 'object') {
    valuesObject = values;
  } else if (typeof values === 'string') {
    try {
      valuesObject = JSON.parse(values);
    } catch (e) {
      logger.error(
        `Tuya function as unmappable "${values}" values on "${featuresCategoryAndType.category}/${featuresCategoryAndType.type}" type with "${code}" code`,
      );
    }
  }

  const feature = {
    name: code || name,
    external_id: `${externalId}:${code}`,
    selector: `${externalId}:${code}`,
    read_only: readOnly,
    has_feedback: false,
    min: 0,
    max: 1,
    ...featuresCategoryAndType,
  };
  if (typeof valuesObject.min === 'number') {
    feature.min = valuesObject.min;
  }
  if (typeof valuesObject.max === 'number') {
    feature.max = valuesObject.max;
  }
  if ('scale' in valuesObject) {
    feature.scale = valuesObject.scale;
  }
  if (temperatureUnit && (codeLower === 'temp_set' || codeLower === 'temp_current') && feature.unit !== undefined) {
    feature.unit = temperatureUnit;
  }
  if (
    feature.scale !== undefined &&
    ((feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
      feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE) ||
      (feature.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING &&
        feature.type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE))
  ) {
    const divider = 10 ** feature.scale;
    feature.min /= divider;
    feature.max /= divider;
  }
  if (feature.read_only === false) {
    feature.has_feedback = true;
  }

  return feature;
}

module.exports = {
  convertFeature,
};
