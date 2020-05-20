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

    const parser = port.pipe(new Readline({ delimiter: '\n' }));

    if (!port.isOpen) {
      parser.on('data', function (data) {
        logger.warn(data.toString('utf8'));
        this.gladys.device.setParam(device, 'CODE', data.toString('utf8'));
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
