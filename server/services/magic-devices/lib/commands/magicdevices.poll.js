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

  const macAdress = device.external_id.split(':')[1];
  const ip = this.deviceIpByMacAdress.get(macAdress);

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

  control.queryState(() => {}).then(currentState => {

    const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    const colorFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.COLOR);
    const warmWhiteFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE);
    const brightnessFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);

    const currentRGB = [currentState.color.red, currentState.color.green, currentState.color.blue];
    const currentHSL = convert.rgb.hsl(currentRGB);
    const currentBrightness = currentHSL[2];

    // for debug or later features ?
    const currentHEX = convert.rgb.hex(currentRGB);
    const currentCSS = convert.rgb.keyword(currentRGB);

    let debugText = '\n################################################';

    // ================================================================================================================
    // =============================================================================================| BINARY - ON/OFF |
    // ================================================================================================================
    if (binaryFeature && binaryFeature.last_value !== currentState.on) {
      emitNewState(this.gladys, macAdress, DEVICE_FEATURE_TYPES.LIGHT.BINARY, currentState.on);
      debugText += '\n#             BINARY CHANGED: ' + currentState.on;
    } else {
      debugText += '\n#     BINARY STAYED THE SAME: ' + currentState.on;
    }
    // ================================================================================================================
    // =======================================================================================================| COLOR |
    // ================================================================================================================
    if (colorFeature && colorFeature.last_value !== currentHSL) {
      debugText += '\n#              COLOR CHANGED: ' + currentHSL;
      emitNewState(this.gladys, macAdress, DEVICE_FEATURE_TYPES.LIGHT.COLOR, currentHSL);
    } else {
      debugText += '\n#      COLOR STAYED THE SAME: ' + currentHSL;
    }
    // ================================================================================================================
    // ==================================================================================================| WARM WHITE |
    // ================================================================================================================
    if (warmWhiteFeature && warmWhiteFeature.last_value !== currentState.warm_white) {
      debugText += '\n#         WARM WHITE CHANGED: ' + currentState.warm_white;
      emitNewState(this.gladys, macAdress, DEVICE_FEATURE_TYPES.LIGHT.COLOR, currentState.warm_white);
    } else {
      debugText += '\n# WARM WHITE STAYED THE SAME: ' + currentState.warm_white;
    }
    // ================================================================================================================
    // ==================================================================================================| BRIGHTNESS |
    // ================================================================================================================
    if (brightnessFeature && brightnessFeature.last_value !== currentBrightness) {
      debugText += '\n#         BRIGHTNESS CHANGED: ' + currentBrightness;
      emitNewState(this.gladys, macAdress, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, currentBrightness);
    } else {
      debugText += '\n# BRIGHTNESS STAYED THE SAME: ' + currentBrightness;
    }

    debugText += '\n################################################';
    console.debug(debugText);

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
