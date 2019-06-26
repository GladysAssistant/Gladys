const logger = require('../../utils/logger');
const PhilipsHueLightHandler = require('./lib/light');
const HueController = require('./api/hue.controller');

module.exports = function PhilipsHueService(gladys, serviceId) {
  // require the node-hue-api module
  const hueClient = require('node-hue-api');
  const philipsHueLightHandler = new PhilipsHueLightHandler(gladys, hueClient, serviceId);

  /**
   * @public
   * @description This function starts the PhilipsHueService service
   * @example
   * gladys.services['philips-hue'].start();
   */
  async function start() {
    logger.log('starting Philips Hue service');
  }

  /**
   * @public
   * @description This function stops the PhilipsHueService service
   * @example
   *  gladys.services['philips-hue'].stop();
   */
  async function stop() {
    logger.log('stopping Philips Hue service');
  }

  return Object.freeze({
    start,
    stop,
    light: philipsHueLightHandler,
    controllers: HueController(philipsHueLightHandler),
  });
};
