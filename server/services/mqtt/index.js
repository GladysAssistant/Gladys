const logger = require('../../utils/logger');
const MqttHandler = require('./lib');
const MqttController = require('./api/mqtt.controller');

module.exports = function MqttService(gladys, serviceId) {
  const mqtt = require('mqtt');
  const mqttHandler = new MqttHandler(gladys, mqtt, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.mqtt.start();
   */
  async function start() {
    logger.info('Starting MQTT service');
    await mqttHandler.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.mqtt.stop();
   */
  async function stop() {
    logger.info('Stopping MQTT service');
    mqttHandler.disconnect();
  }

  /**
   * @public
   * @description This function returns true if the service is used.
   * @returns {Promise<boolean>} Resolves with a boolean.
   * @example
   *  const isUsed = await gladys.services.mqtt.isUsed();
   */
  async function isUsed() {
    return mqttHandler.connected;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: mqttHandler,
    controllers: MqttController(mqttHandler),
  });
};
