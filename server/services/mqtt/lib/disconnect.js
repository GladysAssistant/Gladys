const logger = require('../../../utils/logger');

/**
 * @description Disconnect to all topics.
 * @example
 * disconnect();
 */
function disconnect() {
  this.connected = false;

  if (this.mqttClient) {
    logger.debug(`Disconnecting existing MQTT server...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  } else {
    logger.debug('Not connected');
  }
}

module.exports = {
  disconnect,
};
