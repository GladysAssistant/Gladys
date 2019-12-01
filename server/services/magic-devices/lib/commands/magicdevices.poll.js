const { Control } = require('magic-home');
const convert = require('color-convert');
const { EVENTS, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const { getDeviceFeature } = require('../../../../utils/device');
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

    // Getting features here to have a lighter code later.
    // We have to get the feature with the stateManager, since saveState dosent update the device, only the feature
    const binaryFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`);
    const colorFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`);
    const warmWhiteFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.WARM_WHITE}`);
    const coldWhiteFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.COLD_WHITE}`);
    const brightnessFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`);

    // the magic-home npm package returns 'true' or 'false'.
    // converting it back to binary for easier use with Gladys lights management.
    const currentOn = currentState.on ? 1 : 0;

    // the magic-home npm package returns an rgb Object.
    // converting it to hsl to match Gladys dev guidelines.
    const hsl = convert.rgb.hsl.raw([currentState.color.red, currentState.color.green, currentState.color.blue]);
    console.log("hsl", JSON.stringify(hsl))

    // converting hsl to a string to be stored in DB
    const currentHSL = JSON.stringify({
      h: Math.floor(hsl[0]),
      s: Math.floor(hsl[1]),
      l: Math.floor(hsl[2])
    });

    // Some models have either 0, 1 or 2 whites
    // Cold and warm wight can be simulated to match a yellowish
    // or blueish color
    const currentWarmWhite = Math.floor((100 * currentState.warm_white) / 255);
    const currentColdWhite = Math.floor((100 * currentState.cold_white) / 255);

    // In Magic Home app:
    //    In color mode, scale the rgb values to match the brightness.
    //    In warm white mode, scale from 0 to 255 the value warm white value.
    let currentBrightness = Math.floor(hsl[2]*2);
    if (currentWarmWhite > 0) {
      currentBrightness = Math.floor(currentWarmWhite);
    }

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
      
      console.log("currentWarmWhite: " + JSON.stringify(currentWarmWhite));
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${device.external_id}:${DEVICE_FEATURE_TYPES.LIGHT.WARM_WHITE}`,
        state: currentWarmWhite,
      });
    }
    // ==================================================================================================| BRIGHTNESS |
    if (brightnessFeature && brightnessFeature.last_value !== currentBrightness) {
      console.log("currentBrightness: " + JSON.stringify(currentBrightness));
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
