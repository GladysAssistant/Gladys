const { intToRgb } = require('../../../../utils/colors');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');
const { getDeviceParam } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { DEVICE_IP_ADDRESS, DEVICE_PORT_ADDRESS } = require('../utils/constants');
const { emitNewState } = require('../utils/emitNewState');

const getIntValue = (value) => {
  return parseInt(value.toString(), 10);
};

/**
 * @description Poll value of a Yeelight device.
 * @param {Object} device - The device to control.
 * @returns {Promise<any>} Returns nothing.
 * @example
 * poll(device);
 */
async function poll(device) {
  const lightIp = getDeviceParam(device, DEVICE_IP_ADDRESS);
  const lightPort = getDeviceParam(device, DEVICE_PORT_ADDRESS);
  const yeelight = new this.yeelightApi.Yeelight({ lightIp, lightPort });

  let response;
  try {
    response = await yeelight.connect();
  } catch (error) {
    logger.warn(`Yeelight: ${error}`);
  }
  if (!response || !response.connected) {
    throw new NotFoundError(`YEELIGHT_DEVICE_NOT_FOUND`);
  }

  const state = await yeelight.getProperty([
    this.yeelightApi.DevicePropery.POWER,
    this.yeelightApi.DevicePropery.BRIGHT,
    this.yeelightApi.DevicePropery.CT,
    this.yeelightApi.DevicePropery.RGB,
  ]);
  await yeelight.disconnect();

  const [binary, brightness, temperature, color] = state.result.result;

  // BINARY
  const currentBinaryValue = binary === 'on' ? STATE.ON : STATE.OFF;
  logger.debug(`Yeelight: Power is ${binary}`);

  // BRIGHTNESS
  const currentBrightnessValue = getIntValue(brightness);
  logger.debug(`Yeelight: Brightness at ${currentBrightnessValue}%`);

  // COLOR TEMPERATURE
  const currentTemperatureValue = getIntValue(temperature);
  logger.debug(`Yeelight: Temperature: ${currentTemperatureValue}K`);

  // COLOR
  const currentColorValue = getIntValue(color);
  const rgb = intToRgb(currentColorValue);
  logger.debug(`Yeelight: RGB: ${rgb} (${currentColorValue})`);

  await Promise.all([
    emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BINARY, currentBinaryValue),
    emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, currentBrightnessValue),
    emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE, currentTemperatureValue),
    emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.COLOR, currentColorValue),
  ]);
}

module.exports = {
  poll,
};
