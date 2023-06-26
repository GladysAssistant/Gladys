const logger = require('../../utils/logger');
const PhilipsHueLightHandler = require('./lib/light');
const HueController = require('./api/hue.controller');

module.exports = function PhilipsHueService(gladys, serviceId) {
  // require the node-hue-api module
  // @ts-ignore
  const hueClient = require('node-hue-api').v3;
  const philipsHueLightHandler = new PhilipsHueLightHandler(gladys, hueClient, serviceId);

  /**
   * @public
   * @description This function starts the PhilipsHueService service.
   * @example
   * gladys.services['philips-hue'].start();
   */
  async function start() {
    logger.info('Starting Philips Hue service');
    philipsHueLightHandler.init();
  }

  /**
   * @public
   * @description This function stops the PhilipsHueService service.
   * @example
   *  gladys.services['philips-hue'].stop();
   */
  async function stop() {
    logger.info('Stopping Philips Hue service');
  }

  return Object.freeze({
    start,
    stop,
    device: philipsHueLightHandler,
    controllers: HueController(philipsHueLightHandler),
  });
};
