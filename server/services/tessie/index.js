const logger = require('../../utils/logger');
const netatmoController = require('./api/tessie.controller');

const NetatmoHandler = require('./lib');
const { STATUS } = require('./lib/utils/tessie.constants');

module.exports = function NetatmoService(gladys, serviceId) {
  const netatmoHandler = new NetatmoHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.tessie.start();
   */
  async function start() {
    logger.info('Starting Tessie service', serviceId);
    await netatmoHandler.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.tessie.stop();
   */
  async function stop() {
    logger.info('Stopping Tessie service');
    await netatmoHandler.disconnect();
  }

  /**
   * @public
   * @description Test if Tessie is running.
   * @returns {Promise<boolean>} Returns true if Tessie is used.
   * @example
   *  const used = await gladys.services.tessie.isUsed();
   */
  async function isUsed() {
    return netatmoHandler.status === STATUS.CONNECTED;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: netatmoHandler,
    controllers: netatmoController(netatmoHandler),
  });
};
