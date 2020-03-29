const logger = require('../../utils/logger');
const EweLinkHandler = require('./lib/device');
const EwelinkController = require('./api/ewelink.controller');

module.exports = function EwelinkService(gladys, serviceId) {
  // require the eWeLink module
  // @ts-ignore
  const eweLinkApi = require('ewelink-api');
  const eweLinkHandler = new EweLinkHandler(gladys, eweLinkApi, serviceId);

  /**
   * @public
   * @description This function starts the eWeLink service
   * @example
   * gladys.services.ewelink.start();
   */
  async function start() {
    logger.log('starting eWeLink service');
    await eweLinkHandler.connect();
  }

  /**
   * @public
   * @description This function stops the eWeLink service
   * @example
   * gladys.services.ewelink.stop();
   */
  async function stop() {
    logger.log('stopping eWeLink service');
  }

  return Object.freeze({
    start,
    stop,
    device: eweLinkHandler,
    controllers: EwelinkController(eweLinkHandler),
  });
};
