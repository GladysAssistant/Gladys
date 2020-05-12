const logger = require('../../../utils/logger');
const SerialPort = require('serialport');

/**
 * @description Send a message to the Arduino
 * @param {Object} path - The Arduino path.
 * @example
 * send(path);
 */
async function send(path, message) {
  try {
    
    const textToSend = JSON.stringify(message) + "%";

    const port = new SerialPort(path, {baudRate: 9600, lock: false});

    if (!port.isOpen) {
      port.on('open', function () {
        logger.warn('port opened');
        port.write(textToSend);
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
