const { NotFoundError } = require('../../../../utils/coreErrors');
const { DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');
const { getDeviceParam } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { DEVICE_IP_ADDRESS, DEVICE_PORT_ADDRESS } = require('../utils/constants');

/**
 * @description Change value of a Yeelight device.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @returns {Promise<any>} Returns nothing.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  const lightIp = getDeviceParam(device, DEVICE_IP_ADDRESS);
  const lightPort = getDeviceParam(device, DEVICE_PORT_ADDRESS);
  const yeelight = new this.yeelightApi.Yeelight({ lightIp, lightPort });

  let response;
  try {
    response = await yeelight.connect();
  } catch (error) {
    logger.warn(error);
  }
  if (!response || !response.connected) {
    throw new NotFoundError(`YEELIGHT_DEVICE_NOT_FOUND`);
  }

  let state;
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      state = value === STATE.ON;
      await yeelight.setPower(state);
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS:
      await yeelight.setBright(state);
      break;
    default:
      logger.warn(`Feature type "${deviceFeature.type}" not handled yet !`);
      break;
  }

  return yeelight.disconnect();
}

module.exports = {
  setValue,
};
