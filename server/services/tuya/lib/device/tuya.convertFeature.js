const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');
const { mappings } = require('./tuya.deviceMapping');
const { getMappingForDevice, getDpsMappingForDevice } = require('../models');

/**
 * @description Transforms Tuya feature as Gladys feature.
 * @param {object} tuyaFunctions - Functions from Tuya.
 * @param {string} externalId - Gladys external ID.
 * @param {object} device - Tuya device object.
 * @returns {object} Gladys feature or undefined.
 * @example
 * convertFeature({ code: 'switch', type: 'Boolean', values: '{}' }, 'tuya:device_id', { category: 'cz' });
 */
function convertFeature(tuyaFunctions, externalId, device) {
  const { code, values, name, readOnly } = tuyaFunctions;

  const featuresCategoryAndType = getMappingForDevice(device, code) || mappings[code];
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

  // Apply advanced DPS mapping if available for this code (min/max/unit/scale)
  const dpsMapping = getDpsMappingForDevice(device);
  if (dpsMapping && Array.isArray(dpsMapping.dps)) {
    const dpsEntry = dpsMapping.dps.find((entry) => entry.code === code);
    if (dpsEntry) {
      if (dpsEntry.label) {
        feature.name = dpsEntry.label;
      }
      if (typeof dpsEntry.step === 'number') {
        feature.step = dpsEntry.step;
      } else if (typeof dpsEntry.scale === 'number' && dpsEntry.scale > 0) {
        feature.step = dpsEntry.scale;
      }
      if (typeof dpsEntry.min === 'number') {
        feature.min = dpsEntry.min;
      }
      if (typeof dpsEntry.max === 'number') {
        feature.max = dpsEntry.max;
      }
      if (dpsEntry.unit === 'c') {
        feature.unit = DEVICE_FEATURE_UNITS.CELSIUS;
      }
      if (dpsEntry.unit === 'f') {
        feature.unit = DEVICE_FEATURE_UNITS.FAHRENHEIT;
      }
    }
  }
  if ('min' in valuesObject) {
    feature.min = valuesObject.min;
  }
  if ('max' in valuesObject) {
    feature.max = valuesObject.max;
  }
  if ('step' in valuesObject) {
    feature.step = valuesObject.step;
  }

  return feature;
}

module.exports = {
  convertFeature,
};
