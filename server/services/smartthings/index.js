const logger = require('../../utils/logger');
const SmartThingsHandler = require('./lib');
const SmartThingsController = require('./api/smartthings.controller');

module.exports = function SmartThingsService(gladys, serviceId) {
  const smartthingsHandler = new SmartThingsHandler(gladys, serviceId);
  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.smartthings.start();
   */
  async function start() {
    logger.log('starting SmartThings service');
    await smartthingsHandler.init();
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
    controllers: SmartThingsController(smartthingsHandler, gladys),
  });
};
