const { NotFoundError } = require('../../../../utils/coreErrors');
const { DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');
const { getDeviceParam } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { DEVICE_IP_ADDRESS, DEVICE_PORT_ADDRESS } = require('../utils/constants');
const { emitNewState } = require('../utils/emitNewState');

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
  ]);
  await yeelight.disconnect();

  // BINARY
  const currentBinaryValue = state.result.result[0] === 'on' ? STATE.ON : STATE.OFF;
  emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BINARY, currentBinaryValue);

  // BRIGHTNESS
  const currentBrightnessValue = parseInt(state.result.result[1], 10);
  emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, currentBrightnessValue);
}

module.exports = {
  poll,
};
