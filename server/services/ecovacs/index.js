const logger = require('../../utils/logger');
const EcovacsHandler = require('./lib');
const EcovacsController = require('./api/ecovacs.controller');

module.exports = function EcovacsService(gladys, serviceId) {
  const ecovacsDeebot = require('ecovacs-deebot');
  const ecovacsHandler = new EcovacsHandler(gladys, ecovacsDeebot, serviceId);

  /**
   * @public
   * @description Starts the ecovacs service.
   * @example
   * gladys.services.ecovacs.start();
   */
  async function start() {
    logger.info('Starting ecovacs service');
    await ecovacsHandler.start();
  }

  /**
   * @public
   * @description This function stops the ecovacs service
   * @example
   * gladys.services.ecovacs.stop();
   */
  async function stop() {
    logger.info('Stopping ecovacs service');
    await ecovacsHandler.stop();
  }

  return Object.freeze({
    start,
    stop,
    device: ecovacsHandler,
    controllers: EcovacsController(ecovacsHandler),
  });
};
