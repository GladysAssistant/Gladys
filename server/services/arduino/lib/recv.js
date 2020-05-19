const logger = require('../../../utils/logger');
const SerialPort = require('serialport');
//const Readline = SerialPort.parsers.Readline;

/**
 * @description Send a message to the Arduino
 * @param {Object} device - The Arduino device.
 * @example
 * recv(device);
 */
async function recv(device) {
  try {
    const arduino = await this.gladys.device.getBySelector(
      device.params.find((param) => param.name === 'ARDUINO_LINKED').value
    );
    const arduinoPath = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;

    const port = new SerialPort(arduinoPath, {
      baudRate: 9600,
      lock: false,
      //parser: new Readline('\n'),
    });

    if (!port.isOpen) {
      port.on('data', function (data) {
        logger.warn(data.toString('utf8'));
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
