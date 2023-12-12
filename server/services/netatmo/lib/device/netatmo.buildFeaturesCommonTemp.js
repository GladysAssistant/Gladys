const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Netatmo feature as Gladys feature. Current temperature.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @param {string} featureName - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureTemperature(device_name, 'netatmo:device_id');
 */
function buildFeatureTemperature(name, externalId, featureName) {
  return {
    name: `Temperature - ${name}`,
    external_id: `${externalId}:${featureName}`,
    selector: `${externalId}:${featureName}`,
    category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: -10,
    max: 50,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Temperature setpoint.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureThermSetpointTemperature(device_name, 'netatmo:device_id');
 */
function buildFeatureThermSetpointTemperature(name, externalId) {
  return {
    name: `Setpoint temperature - ${name}`,
    external_id: `${externalId}:therm_setpoint_temperature`,
    selector: `${externalId}:therm_setpoint_temperature`,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    read_only: false,
    keep_history: true,
    has_feedback: false,
    min: 5,
    max: 30,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature.
 * Chosen setpoint_mode (program, away, hg, manual, off, max).
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureThermSetpointMode(device_name, 'netatmo:device_id');
 */
function buildFeatureThermSetpointMode(name, externalId) {
  return {
    name: `Setpoint mode - ${name}`,
    external_id: `${externalId}:therm_setpoint_mode`,
    selector: `${externalId}:therm_setpoint_mode`,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.TEXT,
    read_only: false,
    keep_history: false,
    has_feedback: false,
    min: 0,
    max: 0,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature.
 * Thermostat goes back to schedule after that start timestamp and duration programmed.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureThermSetpointEndTime(device_name, 'netatmo:device_id');
 */
function buildFeatureThermSetpointStartTime(name, externalId) {
  return {
    name: `Setpoint start time - ${name}`,
    external_id: `${externalId}:therm_setpoint_start_time`,
    selector: `${externalId}:therm_setpoint_start_time`,
    category: DEVICE_FEATURE_CATEGORIES.SCHEDULE,
    type: DEVICE_FEATURE_TYPES.SCHEDULE.TIME_HOUR,
    read_only: false,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 12 * 60 * 60 * 1000,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature.
 * Thermostat goes back to schedule after that timestamp.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureThermSetpointEndTime(device_name, 'netatmo:device_id');
 */
function buildFeatureThermSetpointEndTime(name, externalId) {
  return {
    name: `Setpoint end time - ${name}`,
    external_id: `${externalId}:therm_setpoint_end_time`,
    selector: `${externalId}:therm_setpoint_end_time`,
    category: DEVICE_FEATURE_CATEGORIES.SCHEDULE,
    type: DEVICE_FEATURE_TYPES.SCHEDULE.TIME_HOUR,
    read_only: false,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 12 * 60 * 60 * 1000,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Thermostat ask heating.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureHeatingPowerRequest(device_name, 'netatmo:device_id');
 */
function buildFeatureHeatingPowerRequest(name, externalId) {
  return {
    name: `Heating power request - ${name}`,
    external_id: `${externalId}:heating_power_request`,
    selector: `${externalId}:heating_power_request`,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT_REQUEST_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
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
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureOpenWindow(device_name, 'netatmo:device_id');
 */
function buildFeatureOpenWindow(name, externalId) {
  return {
    name: `Detecting open window - ${name}`,
    external_id: `${externalId}:open_window`,
    selector: `${externalId}:open_window`,
    category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1,
  };
}

module.exports = {
  buildFeatureTemperature,
  buildFeatureThermSetpointTemperature,
  buildFeatureThermSetpointMode,
  buildFeatureThermSetpointStartTime,
  buildFeatureThermSetpointEndTime,
  buildFeatureHeatingPowerRequest,
  buildFeatureOpenWindow,
};
