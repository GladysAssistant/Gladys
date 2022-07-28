const linky = require('linky');
const dayjs = require('dayjs');
const logger = require('../../utils/logger');
const EnedisLinkyHandler = require('./lib');
const EnedisLinkyController = require('./api/enedisLinky.controller');

module.exports = function EnedisLinkyService(gladys, serviceId) {
  const device = new EnedisLinkyHandler(gladys, linky, dayjs, serviceId);
  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services['enedis-linky'].start();
   */
  async function start() {
    logger.info('Starting Enedis Linky service');
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services['enedis-linky'].stop();
   */
  async function stop() {
    logger.info('Stopping Enedis Linky service');
  }

  return Object.freeze({
    start,
    stop,
    device,
    controllers: EnedisLinkyController(device),
  });
};
