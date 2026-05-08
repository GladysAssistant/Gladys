const logger = require('../../../../utils/logger');
const { DISCOVERY_TOPIC } = require('../utils/nuki.constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Force MQTT scanning by re-subscribing to topic.
 * @example
 * nukiMQTTHandler.scan();
 */
async function scan() {
  const { mqttOk } = await this.nukiHandler.getStatus();
  if (!mqttOk) {
    throw new ServiceNotConfiguredError('Unable to discover Nuki devices until MQTT service is configured');
  }

  // Clear any existing scan timeout
  if (this.scanTimeout) {
    clearTimeout(this.scanTimeout);
  }

  // Subscribe to discovery topic
  this.mqttService.device.unsubscribe(DISCOVERY_TOPIC);
  this.mqttService.device.subscribe(DISCOVERY_TOPIC, this.handleMessage.bind(this));
  logger.debug(`Nuki: Subscribed to ${DISCOVERY_TOPIC} for discovery`);

  // Automatically unsubscribe after scan timeout to avoid processing all homeassistant messages
  this.scanTimeout = setTimeout(() => {
    this.mqttService.device.unsubscribe(DISCOVERY_TOPIC);
    logger.debug(`Nuki: Unsubscribed from ${DISCOVERY_TOPIC} after scan timeout`);
    this.scanTimeout = null;
  }, this.scanTimeoutMs);
}

module.exports = {
  scan,
};
