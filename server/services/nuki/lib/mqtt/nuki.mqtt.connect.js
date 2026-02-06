const logger = require('../../../../utils/logger');
const { DISCOVERY_TOPIC } = require('../utils/nuki.constants');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * nukiMQTTHandler.connect();
 */
async function connect() {
  logger.debug('MQTT Connect');

  // Subscribe to Nuki topics
  // discover topic
  this.mqttService.device.subscribe(DISCOVERY_TOPIC, this.handleMessage.bind(this));
  // Devices topics
  const devices = await this.nukiHandler.gladys.device.get({ service_id: this.nukiHandler.serviceId });
  devices.forEach((device) => {
    this.subscribeDeviceTopic(device);
  });
}

module.exports = {
  connect,
};
