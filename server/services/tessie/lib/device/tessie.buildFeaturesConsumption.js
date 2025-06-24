const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Tessie feature as Gladys feature.
 * @param {string} externalId - Gladys external ID.
 * @param {string} category - Gladys category.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureConsumption('tessie:vehicle_vin', 'ELECTRICAL_VEHICLE_CONSUMPTION');
 */
function buildFeatureConsumption(externalId, category) {
  return [
    {
      name: 'Energy consumption kWh/100km',
      external_id: `${externalId}:energy_consumption_100mile`,
      selector: `${externalId}-energy-consumption-100mile`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_CONSUMPTION,
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_MILE,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 200,
    },
    {
      name: 'Energy consumption kWh/100km by driving',
      external_id: `${externalId}:energy_consumption_100mile_by_driving`,
      selector: `${externalId}-energy-consumption-100mile-by-driving`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_CONSUMPTION,
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_MILE,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 200,
    },
    {
      name: 'Energy consumption Wh/km',
      external_id: `${externalId}:energy_consumption_mile`,
      selector: `${externalId}-energy-consumption-mile`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_CONSUMPTION,
      unit: DEVICE_FEATURE_UNITS.WATT_HOUR_PER_MILE,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 2000,
    },
    {
      name: 'Energy consumption Wh/km by driving',
      external_id: `${externalId}:energy_consumption_mile_by_driving`,
      selector: `${externalId}-energy-consumption-mile-by-driving`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_CONSUMPTION,
      unit: DEVICE_FEATURE_UNITS.WATT_HOUR_PER_MILE,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 2000,
    },
    {
      name: 'Energy efficiency',
      external_id: `${externalId}:energy_efficiency`,
      selector: `${externalId}-energy-efficiency`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_EFFICIENCY,
      unit: DEVICE_FEATURE_UNITS.MILE_PER_KILOWATT_HOUR,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 999999999,
    },
    {
      name: 'Energy efficiency by driving',
      external_id: `${externalId}:energy_efficiency_by_driving`,
      selector: `${externalId}-energy-efficiency-by-driving`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_EFFICIENCY,
      unit: DEVICE_FEATURE_UNITS.MILE_PER_KILOWATT_HOUR,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 999999999,
    },
  ];
}

module.exports = {
  buildFeatureConsumption,
};
