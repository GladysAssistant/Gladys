const logger = require('../../../utils/logger');
const SerialPort = require('serialport');

/**
 * @description Send a message to the Arduino
 * @param {Object} path - The Arduino path.
 * @example
 * send(path, message, pulse_length);
 */
async function send(path, message, pulse_length) {
  try {
    const textToSend = JSON.stringify(message) + '%';

    const port = new SerialPort(path, { baudRate: 9600, lock: false });

    if (!port.isOpen) {
      port.on('open', function() {
        logger.warn('Arduino: port opened');
        for (var i = 0; i < pulse_length; i++) {
          port.write(textToSend);
        }
      });
    }
  } catch (e) {
    logger.warn('Unable to send message');
    logger.debug(e);
  }
}

module.exports = {
  send,
};
