const logger = require('../../utils/logger');
const Zigbee2mqttManager = require('./lib');
const Zigbee2mqttController = require('./api/zigbee2mqtt.controller');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

module.exports = function Zigbee2mqttService(gladys, serviceId) {
  const mqtt = require('mqtt');
  const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqtt, serviceId);

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.zigbee2mqtt.start();
   */
  async function start() {
    logger.log('Starting Zigbee2mqtt service');
    const zigbee2mqttDriverPath = await gladys.variable.getValue('ZIGBEE2MQTT_DRIVER_PATH', serviceId);
    if (!zigbee2mqttDriverPath) {
      throw new ServiceNotConfiguredError('ZIGBEE2MQTT_DRIVER_PATH_NOT_FOUND');
    }
    
    zigbee2mqttManager.connect(zigbee2mqttDriverPath);
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.zigbee2mqtt.stop();
   */
  function stop() {
    logger.log('Stopping Zigbee2mqtt service');
    zigbee2mqttManager.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: zigbee2mqttManager,
    controllers: Zigbee2mqttController(gladys, zigbee2mqttManager, serviceId),
  });
};
