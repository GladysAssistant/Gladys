const logger = require('../../utils/logger');
const NetatmoManager = require('./lib');
const NetatmoController = require('./api/netatmo.controller');
module.exports = function NetatmoService(gladys, serviceId) {
  const netatmoManager = new NetatmoManager(gladys, serviceId);
  /**
   * @public
   * @description This function listen event on netatmo service
   * @example
   * gladys.services.netatmo.start();
   */
  async function start() {
    logger.log('Starting netatmo service');
    netatmoManager.connect();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.netatmo.stop();
   */
  async function stop() {
    logger.log('Stopping Netatmo service');
  }

  return Object.freeze({
    start,
    stop,
    device: netatmoManager,
    controllers: NetatmoController(netatmoManager),
  });
};
