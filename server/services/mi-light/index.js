const logger = require('../../utils/logger');
const MiLightLightHandler = require('./lib/light');
const MilightController = require('./api/milight.controller');

module.exports = function MiLightService(gladys, serviceId) {
  const milightClient = require('node-milight-promise');
  const miLightLightHandler = new MiLightLightHandler(gladys, milightClient, serviceId);

  /**
   * @public
   * @description This function starts the MiLightService service
   * @example
   * gladys.services['mi-light'].start();
   */
  async function start() {
    logger.log('starting Mi Light service');
    miLightLightHandler.init();
  }

  /**
   * @public
   * @description This function stops the MiLightService service
   * @example
   *  gladys.services['mi-light'].stop();
   */
  async function stop() {
    logger.log('stopping Mi Light service');
  }

  return Object.freeze({
    start,
    stop,
    device: miLightLightHandler,
    controllers: MilightController(miLightLightHandler),
  });
};
