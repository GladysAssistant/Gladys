const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Transforms Netatmo feature as Gladys feature. 
 * Signal RF strength (no signal, weak, average, good or excellent).
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureRfStrength(device_name, 'netatmo:device_id');
 */
function buildFeatureRfStrength(name, externalId) {
  return {
    name: `Link RF quality - ${name}`,
    external_id: `${externalId}:rf_strength`,
    selector: `${externalId}:rf_strength`,
    category: DEVICE_FEATURE_CATEGORIES.SIGNAL,
    type: DEVICE_FEATURE_TYPES.SIGNAL.QUALITY,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 100,
  };
}

module.exports = {
  buildFeatureRfStrength,
};
