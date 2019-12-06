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

  // need a param MODE to make temperature calculus easier
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

  control.queryState(() => {}).then(polledState => {

    console.log("POLLED: " + JSON.stringify(polledState));
    
    // Getting features here to have a lighter code later.
    // We have to get the feature with the stateManager, since saveState doesn't update the device, only the feature
    const binaryFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`);
    const colorFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`);
    const temperatureFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`);
    const brightnessFeature = this.gladys.stateManager.get('deviceFeature', `${device.selector}-${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`);

    // the magic-home npm package returns 'true' or 'false'.
    // converting it back to binary for easier use with Gladys lights management.
    const currentOn = polledState.on ? 1 : 0;

    // the magic-home npm package returns an rgb Object.
    // converting it to hsl to match Gladys dev guidelines.
    const red = polledState.color.red;
    const green = polledState.color.green;
    const blue = polledState.color.blue;

    const hsl = convert.rgb.hsl.raw([red, green, blue]);

    // converting hsl to a string to be stored in DB
    const polledHSL = JSON.stringify({
      h: Math.floor(hsl[0]),
      s: Math.floor(hsl[1]),
      l: Math.floor(hsl[2])
    });

    // In Magic Home app:
    //    In color mode, scale the rgb values to match the brightness.
    //    In warm/cold white mode, scale from 0 to 255
    const polledBrightness = Math.floor(hsl[2]);
    const polledTemperature = getTemperature(polledState, brightnessFeature.last_value, temperatureFeature.last_value_string, polledBrightness);

    // =============================================================================================| BINARY - ON/OFF |
    if (binaryFeature && binaryFeature.last_value !== currentOn) {
      emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BINARY, binaryFeature.last_value, currentOn);
    }
    // =======================================================================================================| COLOR |
    if (colorFeature && colorFeature.last_value_string !== polledHSL) {
      emitNewStringState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.COLOR, colorFeature.last_value_string, polledHSL);
    }
    // ==============================================================| WARM WHITE | COLD WHITE | SIMULATED COLD WHITE |
    // 
    if (temperatureFeature) {
      if (brightnessFeature.last_value !== polledTemperature.value) {
        emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, brightnessFeature.last_value, polledTemperature.value);
      }
      if (temperatureFeature.last_value_string !== polledTemperature.mode) {
        emitNewStringState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE, temperatureFeature.last_value_string, polledTemperature.mode);
      }      
    }
    // ==================================================================================================| BRIGHTNESS |
    else if (brightnessFeature && brightnessFeature.last_value !== polledBrightness) {
      emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, brightnessFeature.last_value, polledBrightness);
    }

  }, error => {
    console.error('MAGIC DEVICES POLL ERROR: ' + error);
  });
}

function getTemperature(polledState, lastTemperatureValue, lastTemperatureMode, polledBrightness) {

  let temperature = {
    "value": lastTemperatureValue,
    "mode": lastTemperatureMode
  }

  if (polledState.warm_white > 0) {
    temperature.value = Math.floor((100 * polledState.warm_white) / 255);
    temperature.mode = DEVICE_FEATURE_TYPES.LIGHT.WARM_WHITE;
  } else if (polledState.cold_white > 0) {
    temperature.value = Math.floor((100 * polledState.cold_white) / 255);
    temperature.mode = DEVICE_FEATURE_TYPES.LIGHT.COLD_WHITE;
  } else if (polledState.color.red === polledState.color.green && polledState.color.red === polledState.color.blue) {
    temperature.value = polledBrightness;
    temperature.mode = DEVICE_FEATURE_TYPES.LIGHT.SIMULATED_COLD_WHITE;
  }

  return temperature;
}

function emitNewState(gladys, device, featureType, oldValue, newValue) {
  logChange(featureType, oldValue, newValue);
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${device.external_id}:${featureType}`,
    state: newValue,
  });
}

function emitNewStringState(gladys, device, featureType, oldValue, newValue) {
  logChange(featureType, oldValue, newValue);
  gladys.event.emit(EVENTS.DEVICE.NEW_STRING_STATE, {
    device: device,
    device_feature_external_id: `${device.external_id}:${featureType}`,
    state: newValue,
  });
}

function logChange(name, oldValue, newValue) {
  console.log(`${name.toUpperCase()} changed: ${oldValue} => ${newValue}`);
}

module.exports = {
  poll,
};
