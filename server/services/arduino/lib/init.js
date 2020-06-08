const logger = require('../../../utils/logger');
const { getDeviceParam } = require('../../../utils/device');
const { onPortData } = require('./onPortData');

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

    arduinoList.forEach(async (arduino) => {
      const arduinoPath = getDeviceParam(arduino, 'ARDUINO_PATH');

      const deviceList = [];
      list.forEach((element) => {
        if (element.model !== 'card' && getDeviceParam(element, 'ARDUINO_LINKED') === arduino.selector) {
          deviceList.push(element);
        }
      });

      if (this.arduinosPorts[arduinoPath] !== undefined && this.arduinosPorts[arduinoPath].isOpen) {
        this.arduinosPorts[arduinoPath].close((err) => {});
      }

      this.arduinosPorts[arduinoPath] = new this.SerialPort(arduinoPath, {
        baudRate: 9600,
        lock: false,
      });

      this.arduinoParsers[arduinoPath] = this.arduinosPorts[arduinoPath].pipe(new this.Readline({ delimiter: '\n' }));

      if (!this.arduinosPorts[arduinoPath].isOpen) {
        this.arduinoParsers[arduinoPath].on('data', async (data) => {
          onPortData(data, this, deviceList);
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
