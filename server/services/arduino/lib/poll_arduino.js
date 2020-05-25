const { DEVICE_FEATURE_TYPES, DEVICE_FUNCTION } = require('../../../utils/constants');

const logger = require('../../../utils/logger');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

//const { send } = require('./send');

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * @description Poll an arduino
 * @param {Object} arduino - The arduino to poll.
 * @example
 * poll(arduino);
 */
async function poll(arduino) {
  try {
    const gladys = this.gladys;
    const arduinoPath = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;
    const list = this.gladys.device.get(arduino.service.id);

    var deviceList = [];
    list.forEach((element) => {
      if (
        element.model !== 'card' &&
        element.params.find((param) => param.name === 'ARDUINO_LINKED').value === arduino.selector
      ) {
        deviceList.push(element);
      }
    });

    const port = new SerialPort(arduinoPath, {
      baudRate: 9600,
      lock: false,
    });

    const parser = port.pipe(new Readline({ delimiter: '\n' }));

    if (!port.isOpen) {
      parser.on('data', async (data) => {
        logger.warn(data.toString('utf8'));
        if (IsJsonString(data.toString('utf8'))) {
          const messageJSON = JSON.parse(data.toString('utf8'));

          deviceList.forEach(async (device) => {
            const function_name = device.params.find((param) => param.name === 'FUNCTION').value;
            if (function_name === messageJSON.function_name) {
              switch (function_name) {
                case DEVICE_FUNCTION.RECV_433:
                  await gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
                  break;
                case DEVICE_FUNCTION.DHT_TEMPERATURE:
                  await gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
                  break;
                case DEVICE_FUNCTION.DHT_HUMIDITY:
                  await gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
                  break;
              }
            }
          });

          parser.on('close', async function(data) {
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
