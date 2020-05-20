const logger = require('../../../utils/logger');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
//const Readline = SerialPort.parsers.Readline;

/**
 * @description Send a message to the Arduino
 * @param {Object} device - The device.
 * @example
 * recv(device);
 */
async function setParam(device, data) {
  try {
    const done = await this.gladys.device.setParam({ id: device.id }, 'CODE', data.toString('utf8'));
  } catch (e) {
    logger.warn('Unable to update param');
    logger.debug(e);
  }
}

module.exports = {
  setParam,
};
