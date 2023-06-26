const logger = require('../../utils/logger');
const EnedisHandler = require('./lib');
const EnedisController = require('./api/enedis.controller');

module.exports = function EnedisService(gladys, serviceId) {
  const enedisHandler = new EnedisHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the enedis service.
   * @example
   * gladys.services.enedis.start();
   */
  async function start() {
    logger.info('Starting enedis service');
    enedisHandler.init();
  }

  /**
   * @public
   * @description This function stops the enedis service.
   * @example
   * gladys.services.enedis.stop();
   */
  async function stop() {
    logger.info('Stopping enedis service');
  }

  return Object.freeze({
    start,
    stop,
    device: enedisHandler,
    controllers: EnedisController(enedisHandler),
  });
};
