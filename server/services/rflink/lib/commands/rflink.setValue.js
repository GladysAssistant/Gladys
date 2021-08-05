const c2xterm = require('color2xterm');
const ObjToRF = require('../../api/rflink.parse.ObjToRF');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { intToHex } = require('../../../../utils/colors');

/**
 * @description Convert an integer to an 8 bits hexa code.
 * @param {string} value - A number.
 * @returns {string} - The converted hexa code.
 * @example
 * to8bitsHex(15022);
 */
function to8bitsHex(value) {
  // really sleazy...
  let s = '';
  let n = value;
  for (; n >= 0; n /= 16) {
    const rem = n % 16;
    n -= rem;
    if (rem === 15) {
      s = `F${s}`;
    } else if (rem === 14) {
      s = `E${s}`;
    } else if (rem === 13) {
      s = `D${s}`;
    } else if (rem === 12) {
      s = `C${s}`;
    } else if (rem === 11) {
      s = `B${s}`;
    } else if (rem === 10) {
      s = `A${s}`;
    } else {
      s = `${rem}${s}`;
    }
    if (n === 0) {
      break;
    }
  }
  return s;
}

/**
 * @description Convert an integer from color picker to an 8 bits hexa color code.
 * @param {string} value - A number.
 * @returns {string} - The converted hexa code.
 * @example
 * intTo8bitsColorHex(15022);
 */
function intTo8bitsColorHex(value) {
  const hex = intToHex(value);
  // Find closest 8bit color code
  const colorCode = c2xterm.hex2xterm(hex);
  return to8bitsHex(colorCode);
}

/**
 * @description Send a message to change a device's value.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The name of feature to control.
 * @param {string} state - The new state.
 * @returns {string} - The message send to RFLink gateway.
 * @example
 * rflink.setValue(device, deviceFeature, state);
 */
function setValue(device, deviceFeature, state) {
  let msg;
  let value;

  value = state;

  if (deviceFeature.type === 'binary') {
    switch (state) {
      case 0:
      case false:
        if (deviceFeature.category === DEVICE_FEATURE_CATEGORIES.SWITCH) {
          value = 'OFF';
        } else if (deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BUTTON) {
          value = 'DOWN';
        }
        break;
      case 1:
      case true:
        if (deviceFeature.category === DEVICE_FEATURE_CATEGORIES.SWITCH) {
          value = 'ON';
        } else if (deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BUTTON) {
          value = 'UP';
        }
        break;
      default:
        value = state;
        break;
    }
  }

  if (device.external_id.split(':')[1] === 'milight') {
    const id = device.external_id.split(':')[2];
    const channel = `0${device.external_id.split(':')[3]}`;
    const feature = deviceFeature.external_id.split(':')[4].toLowerCase();

    if (feature === 'color') {
      const color = intTo8bitsColorHex(value);
      msg = `10;MiLightv1;${id};${channel};${color}98;COLOR;\n`;
    } else if (feature === 'brightness') {
      const featureIndex = device.features.findIndex((f) => f.type === 'color');
      let lastColorValue = '34';
      if (device.features[featureIndex].last_value) {
        lastColorValue = intTo8bitsColorHex(device.features[featureIndex].last_value);
      }
      const hex = to8bitsHex(Math.round((value * 232) / 100));
      msg = `10;MiLightv1;${id};${channel};${lastColorValue}${hex};BRIGHT;\n`;
    } else if (feature === 'power') {
      switch (state) {
        case 0:
        case false:
          value = 'OFF';
          break;
        case 1:
        case true:
          value = 'ON';
          break;
        default:
          value = 'ON';
      }
      msg = `10;MiLightv1;${id};${channel};34BC;${value};\n`;
    } else if (feature === 'milight-mode') {
      msg = `10;MiLightv1;${id};${channel};34BC;MODE${value};\n`;
    }
  } else {
    msg = ObjToRF(device, deviceFeature, value);
  }
  logger.debug(`Message send to USB : "${msg}"`);
  this.sendUsb.write(msg);
  return msg;
}

module.exports = {
  setValue,
};
