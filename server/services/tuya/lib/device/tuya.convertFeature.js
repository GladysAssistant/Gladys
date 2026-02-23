const logger = require('../../../../utils/logger');
const { slugify } = require('../../../../utils/slugify');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { getFeatureMapping, normalizeCode } = require('../mappings');

const scaleNumber = (value, scale) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return value;
  }
  if (!Number.isFinite(scale) || scale === 0) {
    return value;
  }
  return value / 10 ** scale;
};

/**
 * @description Transforms Tuya feature as Gladys feature.
 * @param {object} tuyaFunctions - Functions from Tuya.
 * @param {string} externalId - Gladys external ID.
 * @param {object} options - Conversion options.
 * @returns {object} Gladys feature or undefined.
 * @example
 * convertFeature({ code: 'switch', type: 'Boolean', values: '{}' }, 'tuya:device_id');
 */
function convertFeature(tuyaFunctions, externalId, options = {}) {
  const { code, values, name, readOnly } = tuyaFunctions;
  const { deviceType, temperatureUnit } = options;

  const codeLower = normalizeCode(code);
  if (codeLower === 'temp_unit_convert' || codeLower === 'unit') {
    return undefined;
  }

  const featuresCategoryAndType = getFeatureMapping(code, deviceType);
  if (!featuresCategoryAndType) {
    logger.warn(`Tuya function with "${code}" code is not managed`);
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

  const featureExternalId = `${externalId}:${code}`;
  const featureName = code || name;
  const feature = {
    name: featureName,
    external_id: featureExternalId,
    selector: slugify(featureExternalId),
    read_only: readOnly,
    has_feedback: false,
    min: 0,
    max: 1,
    ...featuresCategoryAndType,
  };
  if (Array.isArray(valuesObject.range)) {
    feature.enum = valuesObject.range;
  }
  const shouldApplyScale =
    feature.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING &&
    feature.type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE;
  const shouldApplySensorScale =
    feature.category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR &&
    feature.type === DEVICE_FEATURE_TYPES.SENSOR.DECIMAL;
  const shouldScale = shouldApplyScale || shouldApplySensorScale;

  if (shouldScale && valuesObject.scale !== undefined) {
    const scale = Number(valuesObject.scale);
    if (Number.isFinite(scale) && scale > 0) {
      feature.scale = scale;
    }
  }
  if ('min' in valuesObject) {
    feature.min = valuesObject.min;
  }
  if ('max' in valuesObject) {
    feature.max = valuesObject.max;
  }

  if (shouldScale && feature.scale && (feature.min !== undefined || feature.max !== undefined)) {
    feature.min = scaleNumber(feature.min, feature.scale);
    feature.max = scaleNumber(feature.max, feature.scale);
  }
  if (temperatureUnit && (codeLower === 'temp_set' || codeLower === 'temp_current')) {
    feature.unit = temperatureUnit;
  }

  return feature;
}

module.exports = {
  convertFeature,
};
