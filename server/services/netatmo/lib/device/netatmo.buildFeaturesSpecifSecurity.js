const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Transforms Netatmo feature as Gladys feature. Camera monitoring status.
 * Read-only for now: switching the monitoring on/off will be unlocked with the camera commands.
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
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 1,
  };
}

module.exports = {
  buildFeatureMonitoring,
};
