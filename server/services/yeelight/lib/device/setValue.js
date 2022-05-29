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

  return yeelight
    .connect()
    .catch((error) => {
      logger.warn(`Yeelight: ${error}`);
      throw new NotFoundError(`YEELIGHT_DEVICE_NOT_FOUND`);
    })
    .then((light) => {
      if (!light || !light.connected) {
        throw new NotFoundError(`YEELIGHT_DEVICE_NOT_FOUND`);
      }

      switch (deviceFeature.type) {
        case DEVICE_FEATURE_TYPES.LIGHT.BINARY: {
          logger.debug(`Yeelight: Set power ${value === STATE.ON ? 'on' : 'off'}`);
          return light.setPower(value === STATE.ON).then(() => light.disconnect());
        }
        case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS: {
          const brightness = this.getIntValue(value); // 1 ~ 100%
          logger.debug(`Yeelight: Set brightness to ${brightness}%`);
          return light.setBright(brightness).then(() => light.disconnect());
        }
        case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE: {
          const temperature = this.getIntValue(value); // 1700k ~ 6500k
          logger.debug(`Yeelight: Set temperature to ${temperature}K`);
          return light.setCtAbx(temperature).then(() => light.disconnect());
        }
        case DEVICE_FEATURE_TYPES.LIGHT.COLOR: {
          const rgb = intToRgb(this.getIntValue(value));
          logger.debug(`Yeelight: Set RGB: ${rgb}`);
          return light
            .setRGB(new this.yeelightApi.Color(rgb[0], rgb[1], rgb[2]), 'sudden')
            .then(() => light.disconnect());
        }
        default:
          logger.warn(`Yeelight: Feature type "${deviceFeature.type}" not handled yet !`);
          return light.disconnect();
      }
    });
}

module.exports = {
  setValue,
};
