const logger = require('../../utils/logger');
const netatmoController = require('./api/netatmo.controller');

const NetatmoHandler = require('./lib');
const { STATUS } = require('./lib/utils/netatmo.constants');

module.exports = function NetatmoService(gladys, serviceId) {
  const netatmoHandler = new NetatmoHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.netatmo.start();
   */
  async function start() {
    logger.info('Starting Netatmo service', serviceId);
    await netatmoHandler.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.netatmo.stop();
   */
  async function stop() {
    logger.info('Stopping Netatmo service');
    await netatmoHandler.disconnect();
  }

  /**
   * @public
   * @description Test if Netatmo is running.
   * @returns {Promise<boolean>} Returns true if Netatmo is used.
   * @example
   *  const used = await gladys.services.netatmo.isUsed();
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
