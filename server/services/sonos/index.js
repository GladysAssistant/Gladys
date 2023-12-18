const logger = require('../../utils/logger');
const SonosHandler = require('./lib');
const sonosController = require('./api/sonos.controller');

module.exports = function SonosService(gladys, serviceId) {
  // @ts-ignore
  const sonosLib = require('@svrooij/sonos');
  const sonosHandler = new SonosHandler(gladys, sonosLib, serviceId);

  /**
   * @public
   * @description This function starts the sonos service service.
   * @example
   * gladys.services['sonos'].start();
   */
  async function start() {
    logger.info('Starting Sonos service');
    sonosHandler.init();
  }

  /**
   * @public
   * @description This function stops the sonos service.
   * @example
   *  gladys.services['sonos'].stop();
   */
  async function stop() {
    logger.info('Stopping sonos service');
  }

  /**
   * @public
   * @description This function return true if the service is used.
   * @returns {Promise<boolean>} Resolves with a boolean.
   * @example
   *  const isUsed = await gladys.services['sonos'].isUsed();
   */
  async function isUsed() {
    return sonosHandler.devices.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: sonosHandler,
    controllers: sonosController(sonosHandler),
  });
};
