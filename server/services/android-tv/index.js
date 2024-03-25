const logger = require('../../utils/logger');
const AndroidTVHandler = require('./lib');
const AndroidTVController = require('./api/androidTV.controller');

module.exports = function AndroidTvService(gladys, serviceId) {
  const androidtv = require('androidtv-remote');
  const androidTVHandler = new AndroidTVHandler(gladys, serviceId, androidtv);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.androidTv.start();
   */
  async function start() {
    logger.info('starting Android TV service');
    await androidTVHandler.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.androidTv.stop();
   */
  async function stop() {
    logger.info('stopping Android TV service');
    // androidTVHandler.stop();
  }

  return Object.freeze({
    start,
    stop,
    device: androidTVHandler,
    controllers: AndroidTVController(androidTVHandler),
  });
};
