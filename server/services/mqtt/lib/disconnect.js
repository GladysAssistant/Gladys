const logger = require('../../../utils/logger');

/**
 * @description Disconnect to all topics
 * @example
 * disconnect();
 */
function disconnect() {
  if (this.mqttClient && !this.mqttClient.disconnected) {
    logger.debug(`Disconnecting existing MQTT server...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
  } else {
    logger.debug('Not connected');
  }
}

module.exports = {
  disconnect,
};
