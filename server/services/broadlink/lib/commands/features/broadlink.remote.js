const deviceClasses = require('node-broadlink/dist/remote');

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../utils/constants');
const { NoValuesFoundError } = require('../../../../../utils/coreErrors');
const logger = require('../../../../../utils/logger');
const { PARAMS } = require('../../utils/broadlink.constants');

/**
 * @description Builds light Broadlink features.
 * @param {string} deviceName - Device name.
 * @param {string} deviceExternalId - Device external ID.
 * @param {Object} broadlinkDevice - Broadlink device.
 * @returns {Array} Gladys features.
 * @example
 * buildFeatures(a1Device);
 */
function buildFeatures(deviceName, deviceExternalId, broadlinkDevice) {
  const { checkTemperature, checkHumidity, TYPE } = broadlinkDevice;

  const features = [];

  // check for temperature sensor
  if (typeof checkTemperature === 'function' && TYPE !== 'RMPRO') {
    const featureExternalId = `${deviceExternalId}:temperature-sensor`;
    features.push({
      name: `${deviceName} temperature`,
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      external_id: featureExternalId,
      selector: featureExternalId,
      min: -50,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      read_only: true,
      has_feedback: false,
    });
  }

  // check for humidity sensor
  if (typeof checkHumidity === 'function') {
    const featureExternalId = `${deviceExternalId}:humidity-sensor`;
    features.push({
      name: `${deviceName} humidity`,
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      external_id: featureExternalId,
      selector: featureExternalId,
      min: 0,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
      read_only: true,
      has_feedback: false,
    });
  }

  return features;
}

/**
 * @description Send IR code using Broadlink device.
 * @param {Object} broadlinkDevice - Broadlink device.
 * @param {Object} gladysDevice - Gladys device.
 * @param {Object} deviceFeature - Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @returns {Promise} Null.
 * @example
 * await setValue(broadlinkDevice, device, deviceFeature, 0);
 */
async function setValue(broadlinkDevice, gladysDevice, deviceFeature, value) {
  const { type } = deviceFeature;
  const valueStr = value.toString();

  const nbExpectedCodes = valueStr.length;
  const relatedParams = [];

  // Get all related params with code first
  for (let i = 0; i < nbExpectedCodes; i += 1) {
    const subValue = valueStr[i];
    const paramNames = [`${PARAMS.CODE}${type}`, `${PARAMS.CODE}${type}-${subValue}`];
    const param = gladysDevice.params.find((p) => paramNames.includes(p.name));

    if (param) {
      relatedParams.push(param);
    }
  }

  if (nbExpectedCodes !== relatedParams.length) {
    throw new NoValuesFoundError(`No IR code found for ${type} feature and ${value} value`);
  }

  // Only if all exist, send them
  await Promise.all(
    relatedParams.map(async (param) => {
      const { name, value: code } = param;
      logger.info(`Broadlink sending IR code for ${name} on ${broadlinkDevice.mac.join(':')}`);

      const bufferCode = Buffer.from(code, 'hex');
      return broadlinkDevice.sendData(bufferCode);
    }),
  );

  return null;
}

/**
 * @description Polling Broadlink device values.
 * @param {Object} broadlinkDevice - Broadlink device.
 * @param {Object} gladysDevice - Gladys device.
 * @returns {Promise} Messages to emit.
 * @example
 * await poll(broadlinkDevice, device);
 */
async function poll(broadlinkDevice, gladysDevice) {
  const { features } = gladysDevice;
  const messages = [];

  // temperature
  const tempFeature = features.find((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR);
  if (tempFeature) {
    const state = await broadlinkDevice.checkTemperature();
    messages.push({
      device_feature_external_id: tempFeature.external_id,
      state,
    });
  }

  // humidity
  const humidityFeature = features.find((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR);
  if (humidityFeature) {
    const state = await broadlinkDevice.checkHumidity();
    messages.push({
      device_feature_external_id: humidityFeature.external_id,
      state,
    });
  }

  return messages;
}

module.exports = {
  deviceClasses,
  buildFeatures,
  setValue,
  poll,
  canLearn: true,
};
