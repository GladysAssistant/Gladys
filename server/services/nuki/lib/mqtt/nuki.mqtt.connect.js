const logger = require('../../../../utils/logger');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * nukiMQTTHandler.connect();
 */
async function connect() {
  logger.debug('MQTT Connect');

  // Subscribe to existing Nuki device topics only
  // Discovery topic (homeassistant/#) is only subscribed during scan() to avoid
  // processing all Home Assistant MQTT messages when not actively discovering
  const devices = await this.nukiHandler.gladys.device.get({ service_id: this.nukiHandler.serviceId });
  devices.forEach((device) => {
    this.subscribeDeviceTopic(device);
  });
}

module.exports = {
  connect,
};
