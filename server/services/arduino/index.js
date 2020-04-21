const logger = require('../../utils/logger');
const ArduinoManager = require('./lib');
const ArduinoController = require('./api/arduino.controller');

module.exports = function ArduinoService(gladys, serviceId) {
  const serial = require('serialport');
  const arduinoManager = new ArduinoManager(serial, gladys.event, serviceId);

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.arduino.start();
   */
  async function start() {
    logger.log('starting Arduino service');
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.arduino.stop();
   */
  async function stop() {
    logger.log('stopping Arduino service');
  }

  return Object.freeze({
    start,
    stop,
    device: arduinoManager,
    controllers: ArduinoController(gladys, arduinoManager, serviceId),
  });
};
