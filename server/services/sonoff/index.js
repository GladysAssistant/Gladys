const logger = require('../../utils/logger');
const SonoffHandler = require('./lib');
const SonoffController = require('./api/sonoff.controller');

module.exports = function SonoffService(gladys, serviceId) {
  const sonoffHandler = new SonoffHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.sonoff.start();
   */
  function start() {
    logger.log('starting Sonoff service');
    sonoffHandler.connect();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.sonoff.stop();
   */
  function stop() {
    logger.log('stopping Sonoff service');
    sonoffHandler.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: sonoffHandler,
    controllers: SonoffController(sonoffHandler),
  });
};
