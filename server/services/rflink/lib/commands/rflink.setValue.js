const ObjToRF = require('../../api/rflink.parse.ObjToRF');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
/**
 * @description send a message to change a device's value
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The name of feature to control.
 * @param {any} state - The new state.
 * @example
 * rflink.SetValue();
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
    if (deviceFeature.external_id.split()[2].toLowerCase() === 'color') {
      msg = `10;MiLightv1;${id};${channel};${value};COLOR;`;
    } else if (deviceFeature.external_id.split()[2].toLowerCase() === 'brightness') {
      msg = `10;MiLightv1;${id};${channel};${value};BRIGHT;`;
    } else if (deviceFeature.external_id.split()[2].toLowerCase() === 'power') {
      msg = `10;MiLightv1;${id};${channel};34BC;${value};`;
    } else if (deviceFeature.external_id.split()[2].toLowerCase() === 'milight-mode') {
      msg = `10;MiLightv1;${id};${channel};34BC;MODE${value};`;
    }
  } else {
    msg = ObjToRF(device, deviceFeature, value);
  }
  logger.log(msg);

  this.sendUsb.write(msg, (error) => {});
  this.sendUsb.write(msg, (error) => {});
  this.sendUsb.write(msg, (error) => {});
}

module.exports = {
  setValue,
};
