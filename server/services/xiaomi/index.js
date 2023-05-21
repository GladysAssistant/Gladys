const logger = require('../../utils/logger');
const XiaomiManager = require('./lib');
const XiaomiController = require('./api/xiaomi.controller');

module.exports = function XiaomiService(gladys, serviceId) {
  const xiaomiManager = new XiaomiManager(gladys, serviceId);
  /**
   * @public
   * @description This function listen event on Xiaomi service.
   * @example
   * gladys.services.xiaomi.start();
   */
  async function start() {
    logger.info('Starting Xiaomi service');
    xiaomiManager.listen();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.xiaomi.stop();
   */
  async function stop() {
    logger.info('Stopping Xiaomi service');
  }

  return Object.freeze({
    start,
    stop,
    controllers: XiaomiController(xiaomiManager),
  });
};
