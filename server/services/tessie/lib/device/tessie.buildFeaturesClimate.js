const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Tessie feature as Gladys feature.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureClimate('tessie:vehicle_vin', 'ELECTRICAL_VEHICLE_CLIMATE', climateState);
 */
function buildFeatureClimate(externalId, category, climateState) {
  return [
    {
      name: 'Climate on',
      external_id: `${externalId}:climate_on`,
      selector: `${externalId}-climate-on`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].CLIMATE_ON,
      read_only: false,
      keep_history: true,
      has_feedback: true,
      min: 0,
      max: 1,
      last_value: climateState.is_climate_on ? 1 : 0,
    },
    {
      name: 'Indoor temperature',
      external_id: `${externalId}:indoor_temperature`,
      selector: `${externalId}-indoor-temperature`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].INDOOR_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: -50,
      max: 50,
      last_value: climateState.inside_temp,
    },
    {
      name: 'Outside temperature',
      external_id: `${externalId}:outside_temperature`,
      selector: `${externalId}-outside-temperature`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].OUTSIDE_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: -50,
      max: 50,
      last_value: climateState.outside_temp,
    },
    {
      name: 'Target temperature',
      external_id: `${externalId}:target_temperature`,
      selector: `${externalId}-target-temperature`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].TARGET_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      read_only: false,
      keep_history: true,
      has_feedback: true,
      min: climateState.min_avail_temp,
      max: climateState.max_avail_temp,
      last_value: climateState.driver_temp_setting,
    },
  ];
}

module.exports = {
  buildFeatureClimate,
};
