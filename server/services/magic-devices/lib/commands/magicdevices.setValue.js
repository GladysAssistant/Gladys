const { Control } = require('magic-home');
const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const convert = require('color-convert');

/**
 * @description Set value.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The feature to control.
 * @param {Object} state - The new state.
 * @example
 * magicDevices.setValue();
 */
function setValue(device, deviceFeature, state) {
  logger.debug(`MagicDevices.setValue : Setting value of device ${device.external_id}`);
  logger.debug(deviceFeature);
  logger.debug(state);

  const macAdress = device.external_id.split(':')[1];
  const ip = this.deviceIpByMacAdress.get(macAdress);

  let control = new Control(ip, {
    wait_for_reply: true,
    log_all_received: false,
    apply_masks: false,
    connect_timeout: null,
    ack: {
        power: true,
        color: true,
        pattern: true,
        custom_pattern: true
    }
  });

  switch(deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      if (state === 0) {
        control.turnOff(success => {
          logger.debug("Gladys turned off the light: " + success);
        });
      } else if (state === 1) {
        control.turnOn(success => {
          logger.debug("Gladys turned on the light: " + success);
        });
      }
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.COLOR:

      const color = convert.hsl.rgb([state.hsl.h, state.hsl.s, state.hsl.l]);

      
      console.log("color " + JSON.stringify(color));


      control.setColor(state.rgb.r, state.rgb.g, state.rgb.b, () => {
        console.log("color setted to " + color);
      });

      // Convenience method to only set the color values.
      // Because the command has to include both color and warm white values,
      // previously seen warm white values will be sent together with the color values.
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE:
      // setWarmWhite(ww, callback)

      // Convenience method to only set the warm white value.
      // Because the command has to include both color and warm white values,
      // previously seen color values will be sent together with the warm white value.
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS:
      // setColorWithBrightness(red, green, blue, brightness, callback)

      // Convenience method to automatically scale down the rgb values to match the brightness parameter (0 - 100).
      // This method uses setColor() internally, so it could set the warm white value to something unexpected.
      break;
    default:
      logger.error('Tried to setValue of an unknown feature type');
  }

}

module.exports = {
  setValue,
};
