const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { addSelector } = require('../../../../utils/addSelector');
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
  const { code, values, readOnly } = tuyaFunctions;
  const { deviceType, ignoredCloudCodes, temperatureUnit, productId } = options;

  const codeLower = normalizeCode(code);
  const ignoredCodes = Array.isArray(ignoredCloudCodes)
    ? ignoredCloudCodes
    : getIgnoredCloudCodes(deviceType, productId);
  if (codeLower && ignoredCodes.includes(codeLower)) {
    return undefined;
  }

  const mappingEntry = getFeatureMapping(code, deviceType, productId);
  if (!mappingEntry) {
    logger.warn(`Tuya function with "${code}" code is not managed`);
    return undefined;
  }
  // tuyaEnum is mapping-only metadata (per-variant mode vocabulary consumed by the read/write
  // pipeline); it must not leak onto the persisted Gladys feature.
  const { tuyaEnum, ...featuresCategoryAndType } = mappingEntry;

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
    external_id: `${externalId}:${code}`,
    selector: `${externalId}:${code}`,
    read_only: readOnly,
    has_feedback: false,
    min: 0,
    max: 1,
    ...featuresCategoryAndType,
  };
  // Display name priority: a curated mapping name wins so device-type mappings
  // can fix Tuya typos (e.g. code "energy_forword_a" -> name "Forward energy A").
  // Otherwise the Tuya code is used as the display name, preserving the existing
  // behaviour for device types without curated names. (`code` is always defined
  // here: an empty code is rejected earlier by getFeatureMapping.)
  feature.name = featuresCategoryAndType.name || code;
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

  addSelector(feature);
  return feature;
}

module.exports = {
  convertFeature,
};
