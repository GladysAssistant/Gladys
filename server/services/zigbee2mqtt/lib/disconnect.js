const logger = require('../../../utils/logger');

/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  // Unsubscribe to Zigbee2mqtt topics
  logger.log('stopping MQTT service for Zigbee2mqtt');

  this.mqttClient.unsubscribe('zigbee2mqtt/#');
}

module.exports = {
  disconnect,
};
