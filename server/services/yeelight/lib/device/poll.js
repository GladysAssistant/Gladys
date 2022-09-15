const { intToRgb } = require('../../../../utils/colors');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');
const { getDeviceParam } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { DEVICE_IP_ADDRESS, DEVICE_PORT_ADDRESS } = require('../utils/constants');
const { emitNewState } = require('../utils/emitNewState');

/**
 * @description Poll value of a Yeelight device.
 * @param {object} device - The device to control.
 * @returns {Promise<any>} Returns nothing.
 * @example
 * poll(device);
 */
async function poll(device) {
  const lightIp = getDeviceParam(device, DEVICE_IP_ADDRESS);
  const lightPort = getDeviceParam(device, DEVICE_PORT_ADDRESS);
  const light = new this.yeelightApi.Yeelight({ lightIp, lightPort });

  try {
    await light.connect();
    if (!light || !light.connected) {
      throw new NotFoundError(`YEELIGHT_DEVICE_NOT_FOUND`);
    }

    const state = await light.getProperty([
      this.yeelightApi.DevicePropery.POWER,
      this.yeelightApi.DevicePropery.BRIGHT,
      this.yeelightApi.DevicePropery.CT,
      this.yeelightApi.DevicePropery.RGB,
    ]);
    await light.disconnect();

    const [binary, brightness, temperature, color] = state.result.result;

    // BINARY
    const currentBinaryValue = binary === 'on' ? STATE.ON : STATE.OFF;
    logger.debug(`Yeelight: Power is ${binary}`);
    emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BINARY, currentBinaryValue);

    // BRIGHTNESS
    const currentBrightnessValue = this.getIntValue(brightness);
    logger.debug(`Yeelight: Brightness at ${currentBrightnessValue}%`);
    emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, currentBrightnessValue);

    // COLOR TEMPERATURE
    const currentTemperatureValue = this.getIntValue(temperature);
    logger.debug(`Yeelight: Temperature: ${currentTemperatureValue}K`);
    emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE, currentTemperatureValue);

    // COLOR
    const currentColorValue = this.getIntValue(color);
    const rgb = intToRgb(currentColorValue);
    logger.debug(`Yeelight: RGB: ${rgb} (${currentColorValue})`);
    emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.COLOR, currentColorValue);
  } catch (error) {
    await light.disconnect();
    throw new NotFoundError(`YEELIGHT_DEVICE_NOT_FOUND`);
  }
}

module.exports = {
  poll,
};
