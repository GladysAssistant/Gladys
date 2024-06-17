const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

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
 * @description Transforms Netatmo feature as Gladys feature. Heating power request.
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
 * @description Transforms Netatmo feature as Gladys feature. Plug connected boiler.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeaturePlugConnectedBoiler(device_name, 'netatmo:device_id');
 */
function buildFeaturePlugConnectedBoiler(name, externalId) {
  return {
    name: `${name} connected boiler`,
    external_id: `${externalId}:plug_connected_boiler`,
    selector: `${externalId}:plug_connected_boiler`,
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
  buildFeatureThermSetpointTemperature,
  buildFeatureBoilerStatus,
  buildFeatureHeatingPowerRequest,
  buildFeaturePlugConnectedBoiler,
  buildFeatureOpenWindow,
};
