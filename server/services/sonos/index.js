const logger = require('../../utils/logger');
const SonosMusicHandler = require('./lib/');
const SonosController = require('./api/sonos.controller');

module.exports = function SonosService(gladys) {
  // here is Sonos module
  const sonosApi = require('sonos');
  const sonosMusicHandler = new SonosMusicHandler(gladys, sonosApi);

  /**
   * @public
   * @description This function starts the SonosService service
   * @example
   * gladys.services.sonos.start();
   */
  async function start() {
    logger.log('starting sonos service');
    sonosMusicHandler.scan();
  }

  /**
   * @public
   * @description This function stops the SonosService service
   * @example
   * gladys.services.sonos.stop();
   */
  async function stop() {
    logger.log('stopping sonos service');
  }

  return Object.freeze({
    start,
    stop,
    music: sonosMusicHandler,
    controllers: SonosController(sonosMusicHandler),
  });
};
