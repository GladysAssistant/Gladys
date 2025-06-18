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
      external_id: `${externalId}:energy_consumption_100km`,
      selector: `tessie-${externalId}-energy-consumption-100km`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_CONSUMPTION,
      unit: DEVICE_FEATURE_UNITS.KWH_PER_100KM,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 200,
    },
    {
      name: 'Energy consumption Wh/km',
      external_id: `${externalId}:energy_consumption_km`,
      selector: `tessie-${externalId}-energy-consumption-km`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_CONSUMPTION,
      unit: DEVICE_FEATURE_UNITS.WATT_HOUR_PER_KM,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 2000,
    },
    {
      name: 'Energy efficiency',
      external_id: `${externalId}:energy_efficiency`,
      selector: `tessie-${externalId}-energy-efficiency`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ENERGY_EFFICIENCY,
      unit: DEVICE_FEATURE_UNITS.KM_PER_KILOWATT_HOUR,
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
