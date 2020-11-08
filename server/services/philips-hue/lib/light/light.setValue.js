const Promise = require('bluebird');

const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { intToRgb } = require('../../../../utils/colors');

const logger = require('../../../../utils/logger');
const { STATE } = require('../../../../utils/constants');
const { parseExternalId } = require('../utils/parseExternalId');
const { transformBrightnessValue } = require('../utils/transformBrightnessValue');
const { NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @description Sets last value of brightness to the light.
 * @param {number} lightId - The light to control id.
 * @param {Object} hueApi - Hue API object.
 * @param {Object} features - The light features.
 * @returns {Promise} - Empty.
 * @example
 * setBrightnessLastValue(lightId, hueApi, features);
 */
async function setBrightnessLastValue(lightId, hueApi, features) {
  await Promise.map(features.filter(({ type }) => type === DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS), feature =>
    hueApi.lights.setLightState(lightId, new this.LightState().bri(transformBrightnessValue(feature.last_value)))
  );
}

/**
 * @description Change value of a Philips hue
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @returns {Promise} - Empty.
 * @example
 * turnOff(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  logger.debug(`Changing state of light ${device.external_id} with value = ${value}`);
  const { lightId, bridgeSerialNumber } = parseExternalId(device.external_id);
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  let state;
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      state = value === STATE.ON ? new this.LightState().on() : new this.LightState().off();
      await hueApi.lights.setLightState(lightId, state);
      if (value === STATE.ON) {
        // Set brightness to last value in case it has been changed while light was off
        await setBrightnessLastValue.call(this, lightId, hueApi, device.features);
      }
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS:
      if (device.features.find(({ type }) => type === DEVICE_FEATURE_TYPES.LIGHT.BINARY).last_value === STATE.ON) {
        // Hue does not support changing brightness while light is off
        state = new this.LightState().bri(transformBrightnessValue(value));
        await hueApi.lights.setLightState(lightId, state);
      }
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.COLOR:
      state = new this.LightState().rgb(intToRgb(value));
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS:
      state = new this.LightState().brightness(value);
      break;
    default:
      logger.debug(`Philips Hue : Feature type = "${deviceFeature.type}" not handled`);
      break;
  }
}

module.exports = {
  setValue,
};
