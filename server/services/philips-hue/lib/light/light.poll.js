const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { LIGHT_EXTERNAL_ID_BASE } = require('../utils/consts');
const { xyToInt, hsbToRgb, rgbToInt, kelvinToRGB, miredToKelvin } = require('../../../../utils/colors');

const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/parseExternalId');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceFeature, normalize } = require('../../../../utils/device');

/**
 * @description Poll value of a Philips hue.
 * @param {object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {
  const { lightId, bridgeSerialNumber } = parseExternalId(device.external_id);
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  const state = await hueApi.lights.getLightState(lightId);

  // if the binary value is different from the value we have, save new state
  const currentBinaryState = state.on ? 1 : 0;
  const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);

  if (binaryFeature && binaryFeature.last_value !== currentBinaryState) {
    logger.debug(`Polling Philips Hue ${lightId}, new binary value = ${currentBinaryState}`);
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${lightId}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
      state: currentBinaryState,
    });
  }

  // if the color value is different from the value we have, save new state
  let currentColorState;
  switch (state.colormode) {
    case 'ct':
      currentColorState = rgbToInt(kelvinToRGB(miredToKelvin(state.ct)));
      break;
    case 'xy':
      currentColorState = xyToInt(state.xy[0], state.xy[1]);
      break;
    case 'hs':
      currentColorState = rgbToInt(hsbToRgb([state.hue, state.sat, state.bri]));
      break;
    default:
  }
  const colorFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.COLOR);

  if (colorFeature && colorFeature.last_value !== currentColorState) {
    logger.debug(
      `Polling Philips Hue ${lightId}, new color value = ${currentColorState} from color mode ${state.colormode}`,
    );
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${lightId}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`,
      state: currentColorState,
    });
  }

  // if the brightness value is different from the value we have, save new state
  const brightnessColorState = state.bri;
  const brightnessFeature = getDeviceFeature(
    device,
    DEVICE_FEATURE_CATEGORIES.LIGHT,
    DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
  );
  const newBrightnessValue = Math.round(normalize(brightnessColorState, 0, 254, 0, 100));
  if (brightnessFeature && brightnessFeature.last_value !== newBrightnessValue) {
    logger.debug(`Polling Philips Hue ${lightId}, new brightness value = ${newBrightnessValue}`);
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${lightId}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
      state: newBrightnessValue,
    });
  }

  const colorTemperatureFeature = getDeviceFeature(
    device,
    DEVICE_FEATURE_CATEGORIES.LIGHT,
    DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
  );
  if (colorTemperatureFeature && colorTemperatureFeature.last_value !== state.ct) {
    logger.debug(`Polling Philips Hue ${lightId}, new color temperature value = ${state.ct}`);
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${lightId}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`,
      state: state.ct,
    });
  }
}

module.exports = {
  poll,
};
