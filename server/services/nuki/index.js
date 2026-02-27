const logger = require('../../utils/logger');
const NukiHandler = require('./lib');
const NukiController = require('./api/nuki.controller');

module.exports = function NukiService(gladys, serviceId) {
  const nukiHandler = new NukiHandler(gladys, serviceId);

  /**
   * @public
   * @description Starts the nuki service.
   * @example
   * gladys.services.nuki.start();
   */
  async function start() {
    logger.info('Starting nuki service');
    await nukiHandler.start();
  }

  /**
   * @public
   * @description This function stops the nuki service.
   * @example
   * gladys.services.nuki.stop();
   */
  async function stop() {
    logger.info('Stopping nuki service');
    await nukiHandler.stop();
  }

  return Object.freeze({
    start,
    stop,
    device: nukiHandler,
    controllers: NukiController(nukiHandler),
  });
};
