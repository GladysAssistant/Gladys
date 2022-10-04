const logger = require('../../utils/logger');
const Zwavejs2mqttManager = require('./lib');
const Zwavejs2mqttController = require('./api/zwavejs2mqtt.controller');

module.exports = function Zwavejs2mqttService(gladys, serviceId) {
  const mqtt = require('mqtt');

  const zwavejs2mqttManager = new Zwavejs2mqttManager(gladys, mqtt, serviceId);

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.zwavejs2mqtt.start();
   */
  async function start() {
    logger.log('Starting Zwavejs2mqtt service');
    await zwavejs2mqttManager.connect();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.zwavejs2mqtt.stop();
   */
  async function stop() {
    logger.info('Stopping Zwavejs2mqtt service');
    await zwavejs2mqttManager.disconnect();
  }

  /**
   * @public
   * @description Get info if the service is used.
   * @returns {Promise<boolean>} Returns true if the service is used.
   * @example
   * gladys.services.zwavejs2mqtt.isUsed();
   */
  async function isUsed() {
    return true;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: zwavejs2mqttManager,
    controllers: Zwavejs2mqttController(gladys, zwavejs2mqttManager, serviceId),
  });
};
