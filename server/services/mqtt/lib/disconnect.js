const logger = require('../../../utils/logger');

/**
 * @description Disconnect to all topics
 * @example
 * disconnect();
 */
async function disconnect() {
  if (this.mqttClient && !this.mqttClient.disconnected) {
    logger.debug(`Disconnecting existing MQTT server...`);
    this.mqttClient.end();
  } else {
    logger.debug('Not connected');
  }
}

module.exports = {
  disconnect,
};
