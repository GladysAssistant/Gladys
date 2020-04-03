const logger = require('../../utils/logger');
const TasmotaHandler = require('./lib');
const TasmotaController = require('./api/tasmota.controller');

module.exports = function TasmotaService(gladys, serviceId) {
  const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.tasmota.start();
   */
  function start() {
    logger.log('starting Tasmota service');
    tasmotaHandler.connect();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.tasmota.stop();
   */
  function stop() {
    logger.log('stopping Tasmota service');
    tasmotaHandler.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: tasmotaHandler,
    controllers: TasmotaController(tasmotaHandler),
  });
};
