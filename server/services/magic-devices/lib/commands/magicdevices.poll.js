const { Control } = require('magic-home');
const convert = require('color-convert');
const { EVENTS, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const { getDeviceFeature } = require('../../../../utils/device');
const { SERVICE_SELECTOR } = require('../utils/constants')
const logger = require('../../../../utils/logger');

/**
 * @description Poll value of a Magic Device
 * @param {Object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {

  // console.log("POLLING: " + device.external_id);

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

  control.queryState(() => {}).then(currentState => {

    const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    const colorFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.COLOR);
    const warmWhiteFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE);
    const brightnessFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);

    const currentOn = currentState.on ? 1 : 0;
    const currentRGB = [currentState.color.red, currentState.color.green, currentState.color.blue];
    const currentHSL = convert.rgb.hsl(currentRGB);
    const currentHSLObject = {
      hue: currentHSL[0],
      saturation: currentHSL[1],
      lightness: currentHSL[2]
    }
    const currentHSLStringified = JSON.stringify(currentHSLObject);
    const currentBrightness = currentHSLObject.lightness;

    // for debug or later features ?
    const currentHEX = `0x${convert.rgb.hex(currentRGB)}`;
    const currentCSS = convert.rgb.keyword(currentRGB);

    let debugText = '\n################################################';

    // ================================================================================================================
    // =============================================================================================| BINARY - ON/OFF |
    // ================================================================================================================
    if (binaryFeature && binaryFeature.last_value !== currentOn) {
      debugText += '\n#             BINARY CHANGED: ' + binaryFeature.last_value + ' -> ' + currentOn;
      emitNewState(this.gladys, macAdress, DEVICE_FEATURE_TYPES.LIGHT.BINARY, currentOn);
    } else {
      debugText += '\n#     BINARY STAYED THE SAME: ' + currentOn;
    }
    // ================================================================================================================
    // =======================================================================================================| COLOR |
    // ================================================================================================================
    if (colorFeature && colorFeature.last_value !== parseInt(currentHEX)) {

      // console.log('################################################');
      // console.log(colorFeature.last_value);
      // console.log(currentHEX);
      // console.log(parseInt(currentHEX));
      // console.log('################################################');


      debugText += '\n#              COLOR CHANGED: ' + colorFeature.last_value + ' -> ' + parseInt(currentHEX);
      emitNewState(this.gladys, macAdress, DEVICE_FEATURE_TYPES.LIGHT.COLOR, parseInt(currentHEX));
    } else {
      debugText += '\n#      COLOR STAYED THE SAME: ' + parseInt(currentHEX);
    }
    // ================================================================================================================
    // ==================================================================================================| WARM WHITE |
    // ================================================================================================================
    if (warmWhiteFeature && warmWhiteFeature.last_value !== currentState.warm_white) {
      debugText += '\n#         WARM WHITE CHANGED: ' + warmWhiteFeature.last_value + ' -> ' + currentState.warm_white;
      emitNewState(this.gladys, macAdress, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE, currentState.warm_white);
    } else {
      debugText += '\n# WARM WHITE STAYED THE SAME: ' + currentState.warm_white;
    }
    // ================================================================================================================
    // ==================================================================================================| BRIGHTNESS |
    // ================================================================================================================
    if (brightnessFeature && brightnessFeature.last_value !== currentBrightness) {
      debugText += '\n#         BRIGHTNESS CHANGED: ' + brightnessFeature.last_value + ' -> ' + currentBrightness;
      emitNewState(this.gladys, macAdress, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, currentBrightness);
    } else {
      debugText += '\n# BRIGHTNESS STAYED THE SAME: ' + currentBrightness;
    }

    debugText += '\n################################################';
    // console.debug(debugText);

  }, error => {
    console.error('MAGIC DEVICES POLL ERROR: ' + error);
  });
}

function emitNewState(gladys, id, feature, value) {
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${SERVICE_SELECTOR}:${id}:${feature}`,
    state: value,
  });
}

module.exports = {
  poll,
};
