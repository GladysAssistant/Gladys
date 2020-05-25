const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const logger = require('../../../utils/logger');
const { DEVICE_FUNCTION } = require('../../../utils/constants');

/**
 * @description Check if a string is parsable into JSON.
 * @param {string} str - The string to check.
 * @returns {boolean} - True if parsable.
 * @example
 * IsJsonString(str);
 */
function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * @description Initialize the communication with the devices.
 * @returns {Promise} - .
 * @example
 * init();
 */
async function init() {
  try {
    const list = await this.gladys.device.get({
      service: 'arduino',
      model: null,
    });

    const arduinoList = [];
    list.forEach((element) => {
      if (element.model === 'card') {
        arduinoList.push(element);
      }
    });

    arduinoList.forEach(async function(arduino) {
      const arduinoPath = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;

      const deviceList = [];
      list.forEach((element) => {
        if (
          element.model !== 'card' &&
          element.params.find((param) => param.name === 'ARDUINO_LINKED').value === arduino.selector
        ) {
          deviceList.push(element);
        }
      });

      if (this.arduinosPorts[arduinoPath] !== undefined && this.arduinosPorts[arduinoPath].isOpen) {
        this.arduinosPorts[arduinoPath].close(function(err) {});
      }

      this.arduinosPorts[arduinoPath] = new SerialPort(arduinoPath, {
        baudRate: 9600,
        lock: false,
      });

      this.arduinoParsers[arduinoPath] = this.arduinosPorts[arduinoPath].pipe(new Readline({ delimiter: '\n' }));

      if (!this.arduinosPorts[arduinoPath].isOpen) {
        this.arduinoParsers[arduinoPath].on('data', async (data) => {
          logger.warn(data.toString('utf8'));
          if (IsJsonString(data.toString('utf8'))) {
            const messageJSON = JSON.parse(data.toString('utf8'));

            deviceList.forEach(async (device) => {
              const functionName = device.params.find((param) => param.name === 'FUNCTION').value;
              if (functionName === messageJSON.function_name) {
                switch (functionName) {
                  case DEVICE_FUNCTION.RECV_433:
                    await this.gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
                    break;
                  case DEVICE_FUNCTION.DHT_TEMPERATURE:
                    await this.gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
                    break;
                  case DEVICE_FUNCTION.DHT_HUMIDITY:
                    await this.gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
                    break;
                  default:
                    break;
                }
              }
            });
          }
        });
      }
    }, this);
  } catch (e) {
    logger.warn('Unable to init device');
    logger.debug(e);
  }
}

module.exports = {
  init,
};
