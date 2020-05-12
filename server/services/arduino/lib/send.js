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
    //const arduinoDevice = await
    //var message = '{"function_name": "emit_433","parameters": {"code": "4464676","bit_length": "24","data_pin": "4"}}%';
    logger.warn(`Path: ${path}`);
    logger.warn(`Message: ${message}`);
    const port = new SerialPort(path, function (err) {
      if (err) {
        return logger.warn('Error: ', err.message);
      }
    });

    if (!port.isOpen) {
      port.on('open', function () {
        logger.warn('port opened');
        port.write(message + "%");
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
