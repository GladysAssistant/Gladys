const { Control } = require('magic-home');
const convert = require('color-convert');
const { EVENTS, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { getDeviceFeature } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');



/**
 * @description Poll value of a Magic Device
 * @param {Object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {

  const macAdress = device.external_id.split(':')[1];
  const ip = this.deviceIpByMacAdress.get(macAdress);

  
  logger.debug("Polling " + device.external_id)

  let control = new Control(ip, {
    wait_for_reply: true,
    log_all_received: true,
    apply_masks: false,
    connect_timeout: null,
    ack: {
        power: true,
        color: true,
        pattern: true,
        custom_pattern: true
    }
  });

  // control.turnOff(success => {
  //   logger.debug(success);
  // });

  // control.turnOn(success => {
  //   logger.debug(success);
  // });
  control.queryState(() => {}).then(response => {
    logger.debug('received status from ' + device.external_id);
    logger.debug(response);

    // if the values are different from the values we have, save new states

    // POWER
    const currentBinaryState = response.on ? 1 : 0;
    const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    if (binaryFeature && binaryFeature.last_value !== currentBinaryState) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `magic-devices:${macAdress}:${DEVICE_FEATURE_TYPES.LIGHT.POWER}`,
        state: response.on,
      });
    } else {
      logger.debug('POWER FEATURE HAS THE SAME VALUE THAN BEFORE: ' + response.on);
    }

    // COLOR
    const colorFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.COLOR);
    const lastValue = colorFeature ? colorFeature.last_value : null;

    const currentColorState = convert.rgb.hex([response.color.red, response.color.green, response.color.blue]);
    const intColor = parseInt(`0x${currentColorState}`);
    

    console.debug(JSON.stringify(colorFeature))
   
    console.debug('        lastValue: ' + lastValue);
    console.debug('currentColorState: ' + intColor + ":" + convert.hex.keyword(currentColorState) + ":" + currentColorState);    
    
    
    if (colorFeature && colorFeature.last_value !== response.color) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `magic-devices:${macAdress}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`,
        state: response.color,
      });
    } else {
      logger.debug('COLOR FEATURE HAS THE SAME VALUE THAN BEFORE: ' + currentColorState);
    }

    // TEMPERATURE - BRIGHTNESS - Warm White
    const currentBrightnessState = response.warm_white;
    const brightnessFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);
    if (brightnessFeature && brightnessFeature.last_value !== currentBrightnessState) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `magic-devices:${macAdress}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
        state: response.warm_white,
      });
    } else {
      logger.debug('BRIGHTNESS FEATURE HAS THE SAME VALUE THAN BEFORE: ' + response.warm_white);
    }

  }, error => {
    console.log('error ' + error);
  });

  

}

module.exports = {
  poll,
};
