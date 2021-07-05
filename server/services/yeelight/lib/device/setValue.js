const { intToRgb } = require('../../../../utils/colors');
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
    logger.warn(`Yeelight: ${error}`);
  }
  if (!response || !response.connected) {
    throw new NotFoundError(`YEELIGHT_DEVICE_NOT_FOUND`);
  }

  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY: {
      logger.debug(`Yeelight: Set power ${value === STATE.ON ? 'on' : 'off'}`);
      await yeelight.setPower(value === STATE.ON);
      break;
    }
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS: {
      logger.debug(`Yeelight: Set brightness to ${value}%`);
      await yeelight.setBright(value);
      break;
    }
    case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE: {
      const temperature = parseInt(value.toString(), 10);
      logger.debug(`Yeelight: Set temperature to ${temperature}K`);
      // await yeelight.setCtAbx(temperature);
      break;
    }
    case DEVICE_FEATURE_TYPES.LIGHT.COLOR: {
      const rgb = intToRgb(parseInt(value.toString(), 10));
      logger.debug(`Yeelight: Set RGB: ${rgb}`);
      await yeelight.setRGB(new this.yeelightApi.Color(rgb[0], rgb[1], rgb[2]), 'sudden');
      break;
    }
    default:
      logger.warn(`Yeelight: Feature type "${deviceFeature.type}" not handled yet !`);
      break;
  }

  return yeelight.disconnect();
}

module.exports = {
  setValue,
};
