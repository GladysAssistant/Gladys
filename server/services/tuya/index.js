const logger = require('../../utils/logger');
const tuyaController = require('./api/tuya.controller');

const TuyaHandler = require('./lib');

module.exports = function TuyaService(gladys, serviceId) {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.tuya.start();
   */
  async function start() {
    logger.info('Starting Tuya service', serviceId);
    await tuyaHandler.init();
    await tuyaHandler.loadDevices();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.tuya.stop();
   */
  async function stop() {
    logger.info('Stopping Tuya service');
    await tuyaHandler.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: tuyaHandler,
    controllers: tuyaController(tuyaHandler),
  });
};
