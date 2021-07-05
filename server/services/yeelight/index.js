const logger = require('../../utils/logger');
const YeelightHandler = require('./lib/device');
const YeelightController = require('./api/yeelight.controller');

module.exports = function YeelightService(gladys, serviceId) {
  // require the yeelight-awesome module
  const yeelightApi = require('yeelight-awesome');
  const yeelightHandler = new YeelightHandler(gladys, yeelightApi, serviceId);

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.yeelight.start();
   */
  function start() {
    logger.log('starting Yeelight service');
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.yeelight.stop();
   */
  function stop() {
    logger.log('stopping Yeelight service');
  }

  return Object.freeze({
    start,
    stop,
    device: yeelightHandler,
    controllers: YeelightController(yeelightHandler),
  });
};
