const logger = require('../../../utils/logger');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * @description Receive a message from the Arduino
 * @param {Object} device - The device.
 * @example
 * recv(device);
 */
async function recv(device) {
  try {
    const gladys = this.gladys;
    const arduino = await gladys.device.getBySelector(
      device.params.find((param) => param.name === 'ARDUINO_LINKED').value,
    );
    const arduinoPath = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;

    const port = new SerialPort(arduinoPath, {
      baudRate: 9600,
      lock: false,
    });

    const parser = port.pipe(new Readline({ delimiter: '\n' }));

    if (!port.isOpen) {
      parser.on('data', async function(data) {
        logger.warn(data.toString('utf8'));
        //gladys.device.setParam(device, 'CODE', data.toString('utf8'));
        if (IsJsonString(data.toString('utf8'))) {
          var messageJSON = JSON.parse(data.toString('utf8'));
          //gladys.device.setParam(device, 'CODE', messageJSON.parameters.value);
          await gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
        }
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
