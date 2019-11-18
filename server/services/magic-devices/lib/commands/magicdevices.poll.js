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
    // ================================================================================================================
    // ==============================================================================================| POWER - ON/OFF |
    // ================================================================================================================
    const currentBinaryState = currentState.on ? 1 : 0;
    const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);

    if (binaryFeature && binaryFeature.last_value !== currentBinaryState) {
      emitNewState(macAdress, DEVICE_FEATURE_TYPES.LIGHT.POWER, currentState.on);
    } else {
      logger.debug('      POWER STAYED THE SAME: ' + currentState.on);
    }

    // ================================================================================================================
    // =================================================================================================| COLOR & HSL |
    // ================================================================================================================
    const currentRGB = [currentState.color.red, currentState.color.green, currentState.color.blue];
    const currentHEX = convert.rgb.hex(currentRGB);
    const currentHSL = convert.rgb.hsl(currentRGB);
    const currentCSS = convert.rgb.keyword(currentRGB);

    const hueFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.HUE);
    const saturationFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.SATURATION);
    const brightnessFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);

    let colorChanged = false;
    
    // HUE
    if (hueFeature && hueFeature.last_value !== currentHSL[0]) {
      emitNewState(macAdress, DEVICE_FEATURE_TYPES.LIGHT.HUE, currentHSL[0]);
      colorChanged = true;
    } else {
      logger.debug('        HUE STAYED THE SAME: ' + currentHSL[0]);
    }

    // SATURATION
    if (saturationFeature && saturationFeature.last_value !== currentHSL[1]) {
      emitNewState(macAdress, DEVICE_FEATURE_TYPES.LIGHT.SATURATION, currentHSL[1]);
      colorChanged = true;
    } else {
      logger.debug(' SATURATION STAYED THE SAME: ' + currentHSL[1]);
    }

    // BRIGHTNESS / LIGHTNESS / VALUE
    if (brightnessFeature && brightnessFeature.last_value !== currentHSL[2]) {
      emitNewState(macAdress, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, currentHSL[2]);
      colorChanged = true;
    } else {
      logger.debug(' BRIGHTNESS STAYED THE SAME: ' + currentHSL[2]);
    }
    
    // COLOR
    if (colorChanged) {
      emitNewState(macAdress, DEVICE_FEATURE_TYPES.LIGHT.COLOR, parseInt(`0x${currentHEX}`));
    } else {
      logger.debug('      COLOR STAYED THE SAME: ' + currentHEX);
    }

    // ================================================================================================================
    // =================================================================================================| TEMPERATURE |
    // ================================================================================================================
    const currentTemperatureState = currentState.warm_white;
    const temperatureFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE);

    if (temperatureFeature && temperatureFeature.last_value !== currentTemperatureState) {
      emitNewState(macAdress, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE, currentState.warm_white);
    } else {
      logger.debug('TEMPERATURE STAYED THE SAME: ' + currentState.warm_white);
    }

  }, error => {
    console.error('error ' + error);
  });
}

function emitNewState(id, feature, value) {
  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${SERVICE_SELECTOR}:${id}:${feature}`,
    state: value,
  });
}

module.exports = {
  poll,
};
