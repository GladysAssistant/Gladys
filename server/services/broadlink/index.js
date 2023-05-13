const logger = require('../../utils/logger');
const BroadlinkHandler = require('./lib');
const BroadlinkController = require('./api/broadlink.controller');

module.exports = function BroadlinkService(gladys, serviceId) {
  const broadlink = require('node-broadlink');
  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.broadlink.start();
   */
  async function start() {
    logger.info('starting Broadlink service');
    await broadlinkHandler.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.broadlink.stop();
   */
  async function stop() {
    logger.info('stopping Broadlink service');
    broadlinkHandler.stop();
  }

  return Object.freeze({
    start,
    stop,
    device: broadlinkHandler,
    controllers: BroadlinkController(broadlinkHandler),
  });
};
