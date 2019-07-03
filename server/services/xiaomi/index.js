/* eslint-disable func-names */
const logger = require('../../utils/logger');
const Hub = require('./lib/listen');

module.exports = function XiaomiService(gladys, serviceId) {
  /**
   * @public
   * @description This function listen event on Xiaomi service
   * @example
   * gladys.services.xiaomi.start();
   */
  async function start() {
    logger.log('starting xiaomi service');
    await Hub.hubDiscover(gladys, serviceId);
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.xiaomi.stop();
   */
  async function stop() {
    logger.log('stopping xiaomi service');
  }

  return Object.freeze({
    start,
    stop,
  });
};
