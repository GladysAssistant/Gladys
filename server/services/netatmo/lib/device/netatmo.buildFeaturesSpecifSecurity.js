const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Transforms Netatmo feature as Gladys feature. Temperature setpoint.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureThermSetpointTemperature(device_name, 'netatmo:device_id');
 */
function buildFeatureCamera(name, externalId) {
  return {
    name,
    selector: `${externalId}:camera`,
    external_id: `${externalId}:camera`,
    category: DEVICE_FEATURE_CATEGORIES.CAMERA,
    type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
    read_only: true,
    keep_history: false,
    has_feedback: false,
    min: 0,
    max: 0,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Power status.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeaturePower(device_name, 'netatmo:device_id');
 */
function buildFeatureStatus(name, externalId) {
  return {
    name: `Status power - ${name}`,
    selector: `${externalId}:status`,
    external_id: `${externalId}:status`,
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1,
  };
}

module.exports = {
  buildFeatureCamera,
  buildFeatureStatus,
};
