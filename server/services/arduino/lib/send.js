const logger = require('../../../utils/logger');

const { onPortOpen } = require('./onPortOpen');

/**
 * @description Send a message to the Arduino
 * @param {Object} path - The Arduino path.
 * @param {Object} message - The message to send.
 * @param {Object} pulseLength - The pulse length.
 * @example
 * send(path, message, pulse_length);
 */
async function send(path, message, pulseLength) {
  try {
    const textToSend = `${JSON.stringify(message)}%`;

    const port = new this.SerialPort(path, { baudRate: 9600, lock: false });

    if (!port.isOpen) {
      port.on('open', () => {
        onPortOpen(port, textToSend, pulseLength);
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
