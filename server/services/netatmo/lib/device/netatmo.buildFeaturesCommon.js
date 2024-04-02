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

/**
 * @description Transforms Netatmo feature as Gladys feature.
 * Signal wifi strength (no signal, weak, average, good or excellent).
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureWifiStrength(device_name, 'netatmo:device_id');
 */
function buildFeatureWifiStrength(name, externalId) {
  return {
    name: `Link Wifi quality - ${name}`,
    external_id: `${externalId}:wifi_strength`,
    selector: `${externalId}:wifi_strength`,
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
  buildFeatureBattery,
  buildFeatureRfStrength,
  buildFeatureWifiStrength,
};
