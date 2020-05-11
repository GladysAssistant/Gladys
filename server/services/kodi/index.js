const logger = require('../../utils/logger');
const KodiHandler = require('./lib/index');
const KodiController = require('./api/kodi.controller');

module.exports = function KodiService(gladys, serviceId) {
  const kodiHandler = new KodiHandler(gladys, gladys.event, serviceId);

  /**
   * @public
   * @description This function starts the KodiService service
   * @example
   * gladys.services.kodi.start();
   */
  async function start() {
    logger.log('starting Kodi service');
    kodiHandler.connect();
  }

  /**
   * @public
   * @description This function stops the KodiService service
   * @example
   * gladys.services.kodi.stop();
   */
  async function stop() {
    logger.log('stopping Kodi service');
    // kodiManager.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: kodiHandler,
    controllers: KodiController(kodiHandler),
  });
};
