const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const logger = require('../../../utils/logger');

const { listen } = require('./listen');

const { DEVICE_FEATURE_TYPES, DEVICE_FUNCTION } = require('../../../utils/constants');

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * @description Init arduino devices
 * @example
 * init();
 */
async function init() {
  try {
    const gladys = this.gladys;

    const list = await this.gladys.device.get({
      service: 'arduino',
      model: null
    });

    var arduinoList = [];
    list.forEach(element => {
      if (element.model === 'card') {
        arduinoList.push(element);
      }
    });

    arduinoList.forEach(arduino => {
      listen(arduino);
    });
  } catch (e) {
    logger.warn('Unable to init device');
    logger.debug(e);
  }
}

module.exports = {
  init
};
