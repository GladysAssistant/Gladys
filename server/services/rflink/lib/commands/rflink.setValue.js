const ObjToRF = require('../../api/rflink.parse.ObjToRF');
const { intTo8bitsColorHex, to8bitsHex } = require('../utils/colors');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

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

  msg = ObjToRF(device, deviceFeature, value);
  // unless we have milight
  if (deviceFeature.external_id !== undefined) {
    if (deviceFeature.external_id.split(':')[4] === 'milight') {
      // sample milight device external_id: `rflink:${msg.id}:${msg.switch}`;
      // sample milight feature external_id: `rflink:${msg.id}:milight-mode:${msg.switch}:milight`,
      const id = device.external_id.split(':')[1];
      const channel = `0${device.external_id.split(':')[2]}`;
      const feature = deviceFeature.external_id.split(':')[2].toLowerCase();

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
    }
  }
  logger.debug(`Message send to USB : "${msg}"`);
  this.sendUsb.write(msg);
  return msg;
}

module.exports = {
  setValue,
};
