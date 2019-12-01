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
  //logger.debug(`MagicDevices.setValue : Setting value of device ${device.external_id}`);
  //logger.debug(deviceFeature);
  //logger.debug(state);

  const macAdress = device.external_id.split(':')[1];
  const ip = this.deviceIpByMacAdress.get(macAdress);

  console.log("TRYING TO SETVALUE: " + ip)

  if (ip === undefined) {
    console.log("    -> NOT SETTING VALUE");
    return
  }

  let control = new Control(ip, {
    wait_for_reply: true,
    log_all_received: true,
    apply_masks: true,
    connect_timeout: null,
    ack: {
        power: false,
        color: false,
        pattern: false,
        custom_pattern: false
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
      const value = JSON.parse(state)
      const color = convert.hsl.rgb([value.h, value.s, value.l]);

      // Convenience method to only set the color values.
      // Because the command has to include both color and warm white values,
      // previously seen warm white values will be sent together with the color values.
      control.setColor(color[0], color[1], color[2], () => {
        console.log("color setted");
      });
      
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE:
      // setWarmWhite(ww, callback)

      // Convenience method to only set the warm white value.
      // Because the command has to include both color and warm white values,
      // previously seen color values will be sent together with the warm white value.
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS:
      const warmWhiteFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.WARM_WHITE}`);
      if (warmWhiteFeature.last_value > 0) {
        control.setWarmWhite(state, () => {
          console.log("warm white brightness setted");
        });
      } else {
        const colorFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`);
        const color = JSON.parse(colorFeature.last_value_string);
        const convertedColor = convert.hsl.rgb([color.h, color.s, color.l]);
        control.setColorWithBrightness(convertedColor[0], convertedColor[1], convertedColor[2], state,  () => {
          console.log("color brightness setted");
        });
      }
      break;
    default:
      logger.error('Tried to setValue of an unknown feature type');
  }

}

module.exports = {
  setValue,
};
