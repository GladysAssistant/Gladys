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

  const ip = device.params.find((param) => param.name === 'IP_ADDRESS')
  
  console.log("TRYING TO POLL: " + ip.value);

  if (ip.value === undefined) {
    console.log("    -> NOT POLLING (IP NOT FOUND IN DEVICE PARAMS)");
    return
  }

  let control = new Control(ip.value, {
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

    // Getting features here to have a lighter code later.
    const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    const colorFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.COLOR);
    const warmWhiteFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.WARM_WHITE);
    const coldWhiteFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.COLD_WHITE);
    const brightnessFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);

    // the magic-home npm package returns 'true' or 'false'.
    // converting it back to binary for easier use with Gladys lights management.
    const currentOn = currentState.on ? 1 : 0;

    // the magic-home npm package returns an rgb Object.
    // converting it to hsl to match Gladys dev guidelines.
    const hsl = convert.rgb.hsl([currentState.color.red, currentState.color.green, currentState.color.blue]);

    // converting hsl to a string to be stored in DB
    const currentHSL = JSON.stringify({
      h: hsl[0],
      s: hsl[1],
      l: hsl[2]
    });

    // In Magic Home app:
    //    In color mode, scale the rgb values to match the brightness.
    //    In warm white mode, scale from 0 to 255 the value warm white value.
    const currentBrightness = hsl[2];

    // Some models have either 0, 1 or 2 whites
    // Cold and warm wight can be simulated to match a yellowish
    // or blueish color
    const currentWarmWhite = (100 * currentState.warm_white) / 255;
    const currentColdWhite = (100 * currentState.cold_white) / 255;

    // =============================================================================================| BINARY - ON/OFF |
    if (binaryFeature && binaryFeature.last_value !== currentOn) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${device.external_id}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
        state: currentOn,
      });
    }
    // =======================================================================================================| COLOR |
    if (colorFeature && colorFeature.last_value_string !== currentHSL) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STRING_STATE, {
        device: device,
        device_feature_external_id: `${device.external_id}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`,
        state: currentHSL,
      });
    }
    // ==================================================================================================| WARM WHITE |
    if (warmWhiteFeature && warmWhiteFeature.last_value !== currentWarmWhite) {
      
      console.log(typeof warmWhiteFeature.last_value, warmWhiteFeature.last_value)
      console.log(typeof currentWarmWhite, currentWarmWhite)
      console.log(warmWhiteFeature.last_value === currentWarmWhite)
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${device.external_id}:${DEVICE_FEATURE_TYPES.LIGHT.WARM_WHITE}`,
        state: currentWarmWhite,
      });
    }
    // ======================================================================================| BRIGHTNESS - LIGHTNESS |
    if (brightnessFeature && brightnessFeature.last_value !== currentBrightness) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${device.external_id}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
        state: currentBrightness,
      });
    }

    console.log("POLLED: " + JSON.stringify(currentState));

  }, error => {
    console.error('MAGIC DEVICES POLL ERROR: ' + error);
  });
}

module.exports = {
  poll,
};
