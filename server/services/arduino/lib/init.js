const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_TYPES, DEVICE_FUNCTION } = require('../../../utils/constants');

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * @description Init arduino devices
 * @example
 * init();
 */
async function init() {
  try {
    const gladys = this.gladys;

    const list = await this.gladys.device.get({
      service: 'arduino',
      model: null
    });

    let arduinoList = [];
    list.forEach(element => {
      if (element.model === 'card') {
        arduinoList.push(element);
      }
    });

    arduinoList.forEach(async function(arduino) {
      const arduinoPath = arduino.params.find(param => param.name === 'ARDUINO_PATH').value;
      const list = await gladys.device.get({
        service: 'arduino',
        model: null
      }, gladys);

      var deviceList = [];
      list.forEach(element => {
        if (
          element.model !== 'card' &&
          element.params.find(param => param.name === 'ARDUINO_LINKED').value === arduino.selector
        ) {
          deviceList.push(element);
        }
      });

      if (this.arduinosPorts[arduinoPath] !== undefined && this.arduinosPorts[arduinoPath].isOpen) {
        this.arduinosPorts[arduinoPath].close(function(err) {});
      }

      this.arduinosPorts[arduinoPath] = new SerialPort(arduinoPath, {
        baudRate: 9600,
        lock: false
      });

      this.arduinoParsers[arduinoPath] = this.arduinosPorts[arduinoPath].pipe(new Readline({ delimiter: '\n' }));

      if (!this.arduinosPorts[arduinoPath].isOpen) {
        this.arduinoParsers[arduinoPath].on('data', async data => {
          logger.warn(data.toString('utf8'));
          if (IsJsonString(data.toString('utf8'))) {
            const messageJSON = JSON.parse(data.toString('utf8'));

            deviceList.forEach(async device => {
              const function_name = device.params.find(param => param.name === 'FUNCTION').value;
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
          }
        });
      }
    });
  } catch (e) {
    logger.warn('Unable to init device');
    logger.debug(e);
  }
}

module.exports = {
  init
};
