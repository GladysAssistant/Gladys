const logger = require('../../utils/logger');
const ArduinoController = require('./api/arduino.controller');

module.exports = function ArduinoService(gladys, serviceId) {

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.serial.start();
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
    controllers: ArduinoController(gladys, serviceId),
  });
};
