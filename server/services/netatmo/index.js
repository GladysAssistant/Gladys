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
    const initResponse = await netatmoHandler.init();
    logger.error('initResponse:', initResponse);
    return initResponse; // Renvoie la réponse de init
    // await netatmoHandler.loadDevices();
  }

  // /**
  //  * @public
  //  * @description This function callback service.
  //  * @example
  //  * gladys.services.netatmo.callback();
  //  */
  // async function callback() {
  //   logger.info('Callback authentication Netatmo service', serviceId);
  //   ???
  // }

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
    return netatmoHandler.status === STATUS.CONNECTED && netatmoHandler.connector !== null;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: netatmoHandler,
    controllers: netatmoController(netatmoHandler),
  });
};
