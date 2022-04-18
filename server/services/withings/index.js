const logger = require('../../utils/logger');
const WithingsHandler = require('./lib/index');
const WithingsController = require('./api/withings.controller');

module.exports = function WithingsService(gladys, serviceId) {
  const withingsHandler = new WithingsHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the WithingsService service
   * @example
   * gladys.services.withings.start();
   */
  async function start() {
    logger.log('starting Withings service');
    await withingsHandler.init();
  }

  /**
   * @public
   * @description This function stops the WithingsService service
   * @example
   * gladys.services.withings.stop();
   */
  async function stop() {
    logger.log('stopping Withings service');
  }

  return Object.freeze({
    start,
    stop,
    device: withingsHandler,
    controllers: WithingsController(gladys, withingsHandler),
  });
};
