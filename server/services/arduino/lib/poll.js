const logger = require('../../../utils/logger');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const { recv } = require('./recv');

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * @description Poll a camera
 * @param {Object} device - The device to poll.
 * @example
 * poll(device);
 */
async function poll(device) {
  try {
    //logger.warn("I'm actually polling !!!");

    const gladys = this.gladys;
    const arduino = await this.gladys.device.getBySelector(
      device.params.find((param) => param.name === 'ARDUINO_LINKED').value
    );
    const arduinoPath = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;

    const port = new SerialPort(arduinoPath, {
      baudRate: 9600,
      lock: false,
    });

    const parser = port.pipe(new Readline({ delimiter: '\n' }));

    if (!port.isOpen) {
      parser.on('data', async function (data) {
        logger.warn(data.toString('utf8'));
        if (IsJsonString(data.toString('utf8'))) {
          var messageJSON = JSON.parse(data.toString('utf8'));
          await gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
          parser.on('close', async function(data){
            logger.warn('Port closed !');
          });
        }
      });
    }

    //recv(device);
  } catch (e) {
    logger.warn('Unable to poll device');
    logger.debug(e);
  }
}

module.exports = {
  poll,
};
