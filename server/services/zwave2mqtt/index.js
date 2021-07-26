const logger = require('../../utils/logger');
const Zwave2mqttHandler = require('./lib');
const Zwave2mqttController = require('./api/zwave2mqtt.controller');

module.exports = function Zwave2mqttService(gladys, serviceId) {
  const zwave2mqttHandler = new Zwave2mqttHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.zwave2mqtt.start();
   */
  function start() {
    logger.info('Starting Zwave2mqtt service');
    zwave2mqttHandler.connect();
    zwave2mqttHandler.startDiscoveringDevices();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.zwave2mqtt.stop();
   */
  function stop() {
    logger.info('Stopping Zwave2mqtt service');
    zwave2mqttHandler.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: zwave2mqttHandler,
    controllers: Zwave2mqttController(zwave2mqttHandler),
  });
};
