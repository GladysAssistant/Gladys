const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const logger = require('../../../../utils/logger');

/**
 * @description Change value of a Philips hue
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {number} value - The new value.
 * @example
 * turnOff(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.MEDIA_PLAYER.BINARY:
      if (value === 1) {
        this.turnOn(device);
      } else {
        this.turnOff(device);
      }
      break;
    // case DEVICE_FEATURE_TYPES.MEDIA_PLAYER.SOURCE:
    //   state = new this.LightState().rgb(intToRgb(value));
    //   break;
    //   case DEVICE_FEATURE_TYPES.MEDIA_PLAYER.CHANNEL:
    //   state = new this.LightState().brightness(value);
    //   break;
    default:
      logger.debug(`Media player : Feature type = "${deviceFeature.type}" not handled`);
      break;
  }
}

module.exports = {
  setValue,
};
