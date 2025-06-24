const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Tessie feature as Gladys feature.
 * @param {string} externalId - Gladys external ID.
 * @param {string} category - Gladys category.
 * @param {object} vehicleState - Vehicle state from Tessie.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureCommand('tessie:vehicle_vin', 'ELECTRICAL_VEHICLE_COMMAND', vehicleState);
 */
function buildFeatureCommand(externalId, category, vehicleState) {
  return [
    {
      name: 'Alarm',
      external_id: `${externalId}:alarm`,
      selector: `${externalId}-alarm`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].ALARM,
      read_only: false,
      keep_history: true,
      has_feedback: true,
      min: 0,
      max: 1,
      last_value: vehicleState.sentry_mode ? 1 : 0,
    },
    {
      name: 'Lock',
      external_id: `${externalId}:lock`,
      selector: `${externalId}-lock`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].LOCK,
      read_only: false,
      keep_history: true,
      has_feedback: true,
      min: 0,
      max: 1,
      last_value: vehicleState.locked ? 1 : 0,
    },
  ];
}

module.exports = {
  buildFeatureCommand,
};
