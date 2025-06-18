const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Tessie feature as Gladys feature.
 * @param {string} externalId - Gladys external ID.
 * @param {string} category - Gladys category.
 * @param {object} driveState - Drive state from Tessie.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureDrive('tessie:vehicle_vin', 'ELECTRICAL_VEHICLE_DRIVE', driveState);
 */
function buildFeatureDrive(externalId, category, driveState) {
  return [
    {
      name: 'Drive energy consumption total',
      external_id: `${externalId}:drive_energy_consumption_total`,
      selector: `tessie-${externalId}-drive-energy-consumption-total`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].DRIVE_ENERGY_CONSUMPTION_TOTAL,
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOURS,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 999999999,
    },
    {
      name: 'Speed',
      external_id: `${externalId}:speed`,
      selector: `tessie-${externalId}-speed`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].SPEED,
      unit: DEVICE_FEATURE_UNITS.MILE_PER_HOUR,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 250,
      last_value: driveState.speed,
    }
  ];
}

module.exports = {
  buildFeatureDrive,
};
