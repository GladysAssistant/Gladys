const deviceClasses = require('node-broadlink/dist/sensor');

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../utils/constants');

/**
 * @description Builds sensor Broadlink features.
 * @param {string} deviceName - Device name.
 * @param {string} deviceExternalId - Device external ID.
 * @returns {Array} Gladys features.
 * @example
 * buildFeatures(a1Device);
 */
function buildFeatures(deviceName, deviceExternalId) {
  return [
    // temperature sensor
    {
      name: `${deviceName} temperature`,
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      external_id: `${deviceExternalId}:temperature-sensor`,
      selector: `${deviceExternalId}:temperature-sensor`,
      min: -50,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      read_only: true,
      has_feedback: false,
    },
    // humidity sensor
    {
      name: `${deviceName} humidity`,
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      external_id: `${deviceExternalId}:humidity-sensor`,
      selector: `${deviceExternalId}:humidity-sensor`,
      min: 0,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
      read_only: true,
      has_feedback: false,
    },
  ];
}

/**
 * @description Polling Broadlink device values.
 * @param {object} broadlinkDevice - Broadlink device.
 * @param {object} gladysDevice - Gladys device.
 * @returns {Promise} Messages to emit.
 * @example
 * await poll(broadlinkDevice, device);
 */
async function poll(broadlinkDevice, gladysDevice) {
  const { features } = gladysDevice;
  const messages = [];

  const { temperature, humidity } = await broadlinkDevice.checkSensors();

  // temperature
  const tempFeature = features.find((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR);
  if (tempFeature) {
    messages.push({
      device_feature_external_id: tempFeature.external_id,
      state: temperature,
    });
  }

  // humidity
  const humidityFeature = features.find((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR);
  if (humidityFeature) {
    messages.push({
      device_feature_external_id: humidityFeature.external_id,
      state: humidity,
    });
  }

  return messages;
}

module.exports = {
  deviceClasses,
  buildFeatures,
  poll,
  canLearn: false,
};
