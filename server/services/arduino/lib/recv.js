const logger = require('../../../utils/logger');
const SerialPort = require('serialport');

/**
 * @description Send a message to the Arduino
 * @param {Object} device - The Arduino device.
 * @example
 * recv(device);
 */
async function recv(device) {
  try {
    const arduinoPath = device.params.find((param) => param.name === 'ARDUINO_PATH').value;
    const model = device.params.find((param) => param.name === 'ARDUINO_MODEL').value;

    const port = new SerialPort(arduinoPath, { baudRate: 9600, lock: false });

    if (!port.isOpen) {
      port.on('data', function () {
        logger.warn('Test received');
        
      });
    }
  } catch (e) {
    logger.warn('Unable to receive message');
    logger.debug(e);
  }
}

module.exports = {
  recv,
};
