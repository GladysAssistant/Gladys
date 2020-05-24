import { DEVICE_FUNCTION } from '../../../../server/utils/constants';

const logger = require('../../../utils/logger');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const { send } = require('./send');
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
 * @description Poll a device
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

    const function_name = device.params.find((param) => param.name === 'FUNCTION').value;

    const arduinoPath = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;

    if (function_name !== DEVICE_FUNCTION.RECV_433) {
      var message = {
        function_name: function_name,
        parameters: {
          data_pin: device.params.find((param) => param.name === 'DATA_PIN').value,
          enable: 1,
        },
      };
      send(arduinoPath, message, 1);
    }

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
          if (function_name === messageJSON.function_name) {
            switch (function_name) {
              case DEVICE_FUNCTION.RECV_433:
                await gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
                break;
              case DEVICE_FUNCTION.DHT_TEMPERATURE:
                await gladys.device.setValue(device, device.features[0], messageJSON.parameters.temperature);
                break;
              case DEVICE_FUNCTION.DHT_HUMIDITY:
                await gladys.device.setValue(device, device.features[0], messageJSON.parameters.humidity);
                break;
            }
          }
          parser.on('close', async function (data) {
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
