const logger = require('../../utils/logger');
const SmartThingsHandler = require('./lib');

module.exports = function SmartThingsService(gladys, serviceId) {
  const stHandler = new SmartThingsHandler(gladys, serviceId);
  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.smartthings.start();
   */
  async function start() {
    logger.log('starting SmartThings service');
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.smartthings.stop();
   */
  async function stop() {
    logger.log('stopping SmartThings service');
  }

  return Object.freeze({
    start,
    stop,
  });
};
