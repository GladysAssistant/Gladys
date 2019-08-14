const logger = require('../../utils/logger');
const Zigbee2mqttHandler = require('./lib');
const Zigbee2mqttController = require('./api/zigbee2mqtt.controller');

module.exports = function Zigbee2mqttService(gladys, serviceId) {
  const zigbee2mqttHandler = new Zigbee2mqttHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.zigbee2mqtt.start();
   */
  function start() {
    logger.log('starting Zigbee2mqtt service');
    zigbee2mqttHandler.connect();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.zigbee2mqtt.stop();
   */
  function stop() {
    logger.log('stopping Zigbee2mqtt service');
    zigbee2mqttHandler.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    client: zigbee2mqttHandler,
    controllers: Zigbee2mqttController(zigbee2mqttHandler),
  });
};
