const logger = require('../../utils/logger');
const TPLinkSmartDevicetHandler = require('./lib/smart-device');
const TPLinkController = require('./api/tp-link.controller');

module.exports = function TpLinkService(gladys, serviceId) {
  // require the tplink-smarthome-api module
  const { Client } = require('tplink-smarthome-api');
  const tpLinkClient = new Client();
  const tpLinkSmartDevicetHandler = new TPLinkSmartDevicetHandler(gladys, tpLinkClient, serviceId);

  /**
   * @public
   * @description This function starts the TpLinkService service.
   * @example
   * gladys.services['tplink'].start();
   */
  async function start() {
    logger.info('Starting TP-Link service');
  }

  /**
   * @public
   * @description This function stops the TpLinkService service.
   * @example
   *  gladys.services['tplink'].stop();
   */
  async function stop() {
    logger.info('Stopping TP-Link service');
  }

  return Object.freeze({
    start,
    stop,
    device: tpLinkSmartDevicetHandler,
    controllers: TPLinkController(tpLinkSmartDevicetHandler),
  });
};
