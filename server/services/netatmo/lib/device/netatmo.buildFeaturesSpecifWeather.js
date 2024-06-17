const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Netatmo feature as Gladys feature. CO2.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureCo2(device_name, 'netatmo:device_id');
 */
function buildFeatureCo2(name, externalId) {
  return {
    name: `CO2 - ${name}`,
    external_id: `${externalId}:co2`,
    selector: `${externalId}:co2`,
    category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.PPM,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 5000,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Humidity.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureHumidity(device_name, 'netatmo:device_id');
 */
function buildFeatureHumidity(name, externalId) {
  return {
    name: `Humidity - ${name}`,
    external_id: `${externalId}:humidity`,
    selector: `${externalId}:humidity`,
    category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 100,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Noise decibel.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureNoise(device_name, 'netatmo:device_id');
 */
function buildFeatureNoise(name, externalId) {
  return {
    name: `Noise - ${name}`,
    external_id: `${externalId}:noise`,
    selector: `${externalId}:noise`,
    category: DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.DECIBEL,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 250,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Current Pressure or Absolute pressure.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @param {string} featureName - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeaturePressure(device_name, 'netatmo:device_id', 'pressure');
 */
function buildFeaturePressure(name, externalId, featureName) {
  return {
    name,
    external_id: `${externalId}:${featureName}`,
    selector: `${externalId}:${featureName}`,
    category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.MILLIBAR,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: -1000,
    max: 2000,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Speed of wind.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @param {string} featureName - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureWindStrength(device_name, 'netatmo:device_id', 'wind_strength');
 */
function buildFeatureWindStrength(name, externalId, featureName) {
  return {
    name,
    external_id: `${externalId}:${featureName}`,
    selector: `${externalId}:${featureName}`,
    category: DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR,
    type: DEVICE_FEATURE_TYPES.SPEED_SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.KILOMETER_PER_HOUR,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 300,
  };
}

/**
 * @description Transforms Netatmo feature as Gladys feature. Angle of wind.
 * @param {string} name - Name device from Netatmo.
 * @param {string} externalId - Gladys external ID.
 * @param {string} featureName - Gladys external ID.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureWindAngle(device_name, 'netatmo:device_id', 'wind_angle');
 */
function buildFeatureWindAngle(name, externalId, featureName) {
  return {
    name,
    external_id: `${externalId}:${featureName}`,
    selector: `${externalId}:${featureName}`,
    category: DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR,
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
 * @description Transforms Netatmo feature as Gladys feature.Precipitation per hour and sum of the day.
 * @param { string } name - Name device from Netatmo.
 * @param { string } externalId - Gladys external ID.
 * @param { string } featureName - Gladys feature constructor.
 * @param { string } unit - Gladys unit.
 * @returns { object } Gladys feature or undefined.
 * @example
 * buildFeatureRain(device_name, 'netatmo:device_id', 'rain', 'mm');
 */
function buildFeatureRain(name, externalId, featureName, unit) {
  return {
    name,
    external_id: `${externalId}:${featureName}`,
    selector: `${externalId}:${featureName}`,
    category: DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit,
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 100,
  };
}
module.exports = {
  buildFeatureCo2,
  buildFeatureHumidity,
  buildFeatureNoise,
  buildFeaturePressure,
  buildFeatureWindStrength,
  buildFeatureWindAngle,
  buildFeatureRain,
};
