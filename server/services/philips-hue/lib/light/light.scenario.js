const Promise = require('bluebird');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../../utils/constants');
const { STATE } = require('../../../../utils/constants');
const { LIGHT_BRIGHTNESS, LIGHT_EXTERNAL_ID_BASE } = require('../utils/consts');

const { parseExternalId } = require('../utils/parseExternalId');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceFeature } = require('../../../../utils/device');
const { transformBrightnessValue } = require('../utils/transformBrightnessValue');

const logger = require('../../../../utils/logger');

/**
 * @description Wait for some time.
 * @param {Object} duration - Duration of the timeout.
 * @returns {Promise} - Nothing.
 * @example wait(1000)
 */
async function wait(duration) {
  return new Promise(res => setTimeout(res, duration));
}

/**
 * @description Fades in a light bulb.
 * @param {Object} device - The device to control.
 * @param {Object} hueApi - The Hue API.
 * @param {string} lightId - The light id.
 * @param {number} duration - The duration of the fade in.
 * @returns {Promise} - Nothing.
 * @example fadeIn(device, hueApi, lightId, { duration: 60000, targetBrightness: 50 })
 */
async function fadeIn(device, hueApi, lightId, { duration = 0, targetBrightness = 100 } = {}) {
  const targetBrightnessHue = targetBrightness;
  const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
  const brightnessFeature =
    getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);
  const initialBinaryState = binaryFeature.last_value;
  const initialBrightnessState = brightnessFeature.last_value;

  if (initialBinaryState === STATE.OFF) {
    // Set light on with minimum brightness
    await this.setValue(device, binaryFeature, STATE.ON);
    await this.setValue(device, brightnessFeature, LIGHT_BRIGHTNESS.MIN);
  } else if (initialBrightnessState >= targetBrightness) {
    // Light is already on and brightness is high enough, let's wait for the duration
    await wait(duration);
    return;
  }

  await this.setValue(device, brightnessFeature, targetBrightnessHue, { duration });

  const { bridgeSerialNumber } = parseExternalId(device.external_id);
  const deviceBrightnessFeatureExternalId = `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${lightId}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`;
  const hueTargetValue = transformBrightnessValue(targetBrightnessHue);
  await new Promise(async (resolve) => {
      const listener = async (event) => {
        if (event.device_feature_external_id === deviceBrightnessFeatureExternalId) {
          if (event.state === hueTargetValue) {
            // Target brightness reached, resolve
            resolve();
            this.gladys.event.removeListener(EVENTS.DEVICE.NEW_STATE, listener);
          } else {
            // Target brightness not reached, wait 5 seconds before next poll
            await wait(5000);
            this.poll(device);
          }
        }
      };
      this.gladys.event.on(EVENTS.DEVICE.NEW_STATE, listener);

      await this.poll(device);
  });
}

/**
 * @description Runs a scenario made of several actions.
 * @param {Object} device - The light device.
 * @param {Object} deviceFeature - The light device feature.
 * @param {Object} value - The value.
 * @returns {Promise} Nothing.
 * @example scenario(device, deviceFeature, value)
 */
async function scenario(device, deviceFeature, value) {
  const { lightId, bridgeSerialNumber } = parseExternalId(device.external_id);
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.FADE_IN:
      await fadeIn.call(this, device, hueApi, lightId, value);
      break;
    default:
      logger.debug(`Philips Hue : Feature type = "${deviceFeature.type}" not handled`);
      break;
  }
}

module.exports = {
  scenario,
};
