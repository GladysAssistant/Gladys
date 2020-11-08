const Promise = require('bluebird');

const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { STATE } = require('../../../../utils/constants');
const { LIGHT_BRIGHTNESS,  } = require('../utils/consts');

const { parseExternalId } = require('../utils/parseExternalId');
const { transformBrightnessValue } = require('../utils/transformBrightnessValue');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { setValue } = require('./light.setValue');

const logger = require('../../../../utils/logger');

async function wait(duration) {
  return new Promise(res => setTimeout(res, duration));
}

async function fadeIn(device, hueApi, lightId, { duration, targetBrightness }) {
  const targetBrightnessHue = transformBrightnessValue(targetBrightness);
  const [binaryFeature, brightnessFeature] = [DEVICE_FEATURE_TYPES.LIGHT.BINARY, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]
    .map(featureName => device.features.find(({ type }) => type === featureName));
  const initialBinaryState = binaryFeature.last_value;
  const timeStep = duration / targetBrightnessHue;
  const brightnessLastValue = brightnessFeature.last_value; // TODO: Would be better to get this value directly from Hue

  let step = 1;
  if (initialBinaryState === STATE.OFF) {
    // Set light on with minimum brightness
    await setValue(device, brightnessFeature, LIGHT_BRIGHTNESS.MIN);
    await setValue(device, binaryFeature, STATE.ON);
  } else if (targetBrightnessHue >= brightnessLastValue) {
    // Light is on and brightness is already set with at least target value
    // Let's wait for duration
    await wait(duration);
    return;
  } else {
    // Light is on and brightness still needs to reach target value
    // Let's wait until it should have been this value
    await wait( timeStep * brightnessLastValue);
    step = brightnessLastValue;
  }

  // Process scheduled steps
  while(step <= targetBrightnessHue) {
    await wait(timeStep);
    // TODO: Check brightness value has not manually changed, otherwise it means the scene should not go on
    setValue(device, brightnessFeature, step);  // Do not wait for answer not to delay steps
    step += 1;
  }
}

async function scenario (device, deviceFeature, value) {
  const { lightId, bridgeSerialNumber } = parseExternalId(device.external_id);
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.FADE_IN:
      await fadeIn(device, hueApi, lightId, value);
      break;
    default:
      logger.debug(`Philips Hue : Feature type = "${deviceFeature.type}" not handled`);
      break;
  }
}

module.exports = {
  scenario,
};
