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
  logger.debug(`device ${device.external_id}`);
  logger.debug(`deviceFeature ${deviceFeature.external_id}`);
  //rflink:milight:F746:1
  if (device.external_id.split(':')[1] === 'milight') {
    const id = device.external_id.split(':')[2];
    const channel = `0${device.external_id.split(':')[3]}`;
    const feature = deviceFeature.external_id.split(':')[4].toLowerCase();
    logger.debug(`id ${id}`);
    logger.debug(`channel ${channel}`);
    logger.debug(`feature ${feature}`);
    if (feature === 'color') {
      msg = `10;MiLightv1;${id};${channel};${value};COLOR;`;
    } else if (feature === 'brightness') {
      msg = `10;MiLightv1;${id};${channel};${value};BRIGHT;`;
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
      }
      msg = `10;MiLightv1;${id};${channel};34BC;${value};\n`;
    } else if (feature === 'milight-mode') {
      msg = `10;MiLightv1;${id};${channel};34BC;MODE${value};\n`;
    }
  } else {
    msg = ObjToRF(device, deviceFeature, value);
  }
  logger.debug(`Message send to USB : "${msg}"`);
  this.sendUsb.write(msg, (error) => {});

}

module.exports = {
  setValue,
};
