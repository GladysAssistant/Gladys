const logger = require('../../../../utils/logger');
const { DISCOVERY_TOPIC } = require('../utils/nuki.constants');

/**
 * @description Disconnect service from dependencies.
 * @example
 * nukiMQTTHandler.disconnect();
 */
async function disconnect() {
  logger.debug(`Call MQTT disconnect`);
  // Unsubscribe to Nuki topics
  this.mqttService.device.unsubscribe(DISCOVERY_TOPIC);
  // Unsubscribe devices topics
  const devices = await this.nukiHandler.gladys.device.get({ service_id: this.nukiHandler.serviceId });
  devices.forEach((device) => {
    const topic = `nuki/${device.external_id.split(':')[1]}/#`;
    this.mqttService.device.unsubscribe(topic);
  });
}

module.exports = {
  disconnect,
};
