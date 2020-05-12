const logger = require('../../utils/logger');
const HeatzyHandler = require('./lib');
const HeatzyController = require('./api/heatzy.controller');

module.exports = function HeatzyService(gladys, serviceId) {
  const heatzyLib = require('heatzy');
  const heatzyHandler = new HeatzyHandler(gladys, heatzyLib, serviceId);

  /**
   * @public
   * @description This function starts the HeatzyService service
   * @example
   * gladys.services.heatzy.start();
   */
  async function start() {
    logger.log('Starting Heatzy service');

    await heatzyHandler.connect();
  }

  /**
   * @public
   * @description This function stops the HeatzeService service
   * @heatzy
   * gladys.services.heatzy.stop();
   */
  async function stop() {
    logger.log('stopping heatzy service');
  }

  return Object.freeze({
    start,
    stop,
    devices: heatzyHandler,
    controllers: HeatzyController(heatzyHandler)
  });
};
