const ObjToRF = require('../../api/rflink.parse.ObjToRF');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
var namer = require('color-namer');
const logger = require('../../../../utils/logger');
const { intToHex } = require('../../../../utils/colors');
const c2xterm = require('color2xterm');

/**
 * @param {number}
 *          n - Number between 0 and 360 (not set if undefined)
 */
const tohex = function(n) {
	// really sleazy...
	var s = ""
	for ( ; n >= 0; n /= 16) {
		rem = n % 16
		n -= rem
		if (rem == 15)
			s = "F" + s
		else if (rem == 14)
			s = "E" + s
		else if (rem == 13)
			s = "D" + s
		else if (rem == 12)
			s = "C" + s
		else if (rem == 11)
			s = "B" + s
		else if (rem == 10)
			s = "A" + s
		else
			s = rem + s
		if (n == 0)
			break
	}
	return s
};

/**
 * @param {number}
 *          value - Value of the color picker
 */
const intTo8bitsColorHex = function(value) {
  const hex = intToHex(value);
  // Find closest 8bit color code
  const colorCode = c2xterm.hex2xterm(hex);
  logger.debug(`Nearest 8bits color code ${colorCode}`);
  return tohex(colorCode);
};

/**
 * @description send a message to change a device's value
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The name of feature to control.
 * @param {string} state - The new state.
 * @example
 * rflink.setValue();
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
      const last_color_value = intTo8bitsColorHex(device.features[featureIndex].last_value);
      const hex = tohex(Math.round( (value*232)/100) );
      msg = `10;MiLightv1;${id};${channel};${last_color_value}${hex};BRIGHT;\n`;
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
}

module.exports = {
  setValue,
};
