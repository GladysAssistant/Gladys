const logger = require('../../utils/logger');
const Zigbee2mqttManager = require('./lib');
const Zigbee2mqttController = require('./api/zigbee2mqtt.controller');

module.exports = function Zigbee2mqttService(gladys, serviceId) {
  const mqtt = require('mqtt');
  const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqtt, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.zigbee2mqtt.start();
   */
  async function start() {
    logger.log('Starting Zigbee2mqtt service');
    await zigbee2mqttManager.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.zigbee2mqtt.stop();
   */
  function stop() {
    logger.log('Stopping Zigbee2mqtt service');
    zigbee2mqttManager.disconnect();
  }

  /**
   * @public
   * @description Test if Zigbee2mqtt is running.
   * @returns {Promise<boolean>} Returns true if Z2M is used.
   * @example
   *  const used = await gladys.services.zigbee2mqtt.isUsed();
   */
  async function isUsed() {
    return zigbee2mqttManager.gladysConnected && zigbee2mqttManager.zigbee2mqttConnected;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: zigbee2mqttManager,
    controllers: Zigbee2mqttController(gladys, zigbee2mqttManager),
  });
};
