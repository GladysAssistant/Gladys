const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Transforms Netatmo feature as Gladys feature. Camera monitoring switch.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature.
 * @example
 * buildFeatureMonitoring(device_name, 'netatmo:device_id');
 */
function buildFeatureMonitoring(name, externalId) {
  return {
    name: `Monitoring - ${name}`,
    selector: `${externalId}:monitoring`,
    external_id: `${externalId}:monitoring`,
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    read_only: false,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Camera image.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature.
 * @example
 * buildFeatureCamera(device_name, 'netatmo:device_id');
 */
function buildFeatureCamera(name, externalId) {
  return {
    name: `Camera - ${name}`,
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

module.exports = {
  buildFeatureMonitoring,
  buildFeatureCamera,
};
