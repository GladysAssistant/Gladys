const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Netatmo feature as Gladys feature.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureBattery(device_name, 'netatmo:device_id');
 */
function buildFeatureBattery(name, externalId) {
  return {
    name: `Battery - ${name}`,
    external_id: `${externalId}:battery_percent`,
    selector: `${externalId}:battery_percent`,
    category: DEVICE_FEATURE_CATEGORIES.BATTERY,
    type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 100,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @param {string} featureName - Netatmo feature name.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureLastSeen(device_name, 'netatmo:device_id', 'last_therm_seen');
 */
function buildFeatureLastSeen(name, externalId, featureName) {
  return {
    name: `Last seen - ${name}`,
    external_id: `${externalId}:${featureName}`,
    selector: `${externalId}:${featureName}`,
    category: DEVICE_FEATURE_CATEGORIES.SCHEDULE,
    type: DEVICE_FEATURE_TYPES.SCHEDULE.TIME_DAY_HOUR,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 12 * 60 * 60 * 1000,
  };
}

module.exports = {
  buildFeatureBattery,
  buildFeatureLastSeen,
};
