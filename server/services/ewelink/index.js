const logger = require('../../utils/logger');
const EweLinkHandler = require('./lib/device');
const EwelinkController = require('./api/ewelink.controller');

module.exports = function EwelinkService(gladys, serviceId) {
  // require the eWeLink module
  const eWeLinkApi = require('ewelink-api');
  const eWeLinkHandler = new EweLinkHandler(gladys, eWeLinkApi, serviceId);

  /**
   * @public
   * @description This function starts the eWeLink service.
   * @example
   * gladys.services.ewelink.start();
   */
  async function start() {
    logger.info('Starting eWeLink service');
    await eWeLinkHandler.connect();
  }

  /**
   * @public
   * @description This function stops the eWeLink service.
   * @example
   * gladys.services.ewelink.stop();
   */
  async function stop() {
    logger.info('Stopping eWeLink service');
  }

  return Object.freeze({
    start,
    stop,
    device: eWeLinkHandler,
    controllers: EwelinkController(eWeLinkHandler),
  });
};
