const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Netatmo feature as Gladys feature. Heating boiler status.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureHeatingBoilerStatus(device_name, 'netatmo:device_id');
 */
function buildFeatureBoilerStatus(name, externalId) {
  return {
    name: `Boiler status - ${name}`,
    external_id: `${externalId}:boiler_status`,
    selector: `${externalId}:boiler_status`,
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Boiler valve comfort boost.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureHeatingBoilerValveComfortBoost(device_name, 'netatmo:device_id');
 */
function buildFeatureHeatingBoilerValveComfortBoost(name, externalId) {
  return {
    name: `Boiler valve comfort boost - ${name}`,
    external_id: `${externalId}:boiler_valve_comfort_boost`,
    selector: `${externalId}:boiler_valve_comfort_boost`,
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Physical orientation of the thermostat module.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureThermOrientation(device_name, 'netatmo:device_id');
 */
function buildFeatureThermOrientation(name, externalId) {
  return {
    name: `${name} orientation`,
    external_id: `${externalId}:therm_orientation`,
    selector: `${externalId}:therm_orientation`,
    category: DEVICE_FEATURE_CATEGORIES.ORIENTATION_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.DEGREE,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 360,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Indicates whether the boiler is heating or not.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureThermRelayCmd(device_name, 'netatmo:device_id');
 */
function buildFeatureThermRelayCmd(name, externalId) {
  return {
    name: `${name} relay command`,
    external_id: `${externalId}:therm_relay_cmd`,
    selector: `${externalId}:therm_relay_cmd`,
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Heating anticipation mode.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureAnticipating(device_name, 'netatmo:device_id');
 */
function buildFeatureAnticipating(name, externalId) {
  return {
    name: `Anticipating - ${name}`,
    external_id: `${externalId}:anticipating`,
    selector: `${externalId}:anticipating`,
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureHeatingBoilerValveComfortBoost(device_name, 'netatmo:device_id');
 */
function buildFeatureLastThermSeen(name, externalId) {
  return {
    name: `Last ${name} seen`,
    external_id: `${externalId}:last_therm_seen`,
    selector: `${externalId}:last_therm_seen`,
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
  buildFeatureBoilerStatus,
  buildFeatureHeatingBoilerValveComfortBoost,
  buildFeatureThermOrientation,
  buildFeatureThermRelayCmd,
  buildFeatureAnticipating,
  buildFeatureLastThermSeen,
};
