const logger = require('../../../../utils/logger');

/**
 * @description Disconnect zwave MQTT.
 * @example
 * zwave.disconnect();
 */
async function disconnect() {
  if (this.connected) {
    logger.debug(`Zwave : Disconnecting...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  } else {
    logger.debug('Zwave: Not connected, disconnecting');
  }
  this.connected = false;
  this.ready = false;
  this.scanInProgress = false;
}

module.exports = {
  disconnect,
};
