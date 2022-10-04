const logger = require('../../../../utils/logger');

/**
 * @description Disconnect zwave MQTT.
 * @example
 * zwave.disconnect();
 */
async function disconnect() {
  if (this.mqttConnected) {
    logger.debug(`Zwavejs2mqtt : Disconnecting...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  } else {
    logger.debug('Zwavejs2mqtt: Not connected, disconnecting');
  }
  this.mqttConnected = false;
  this.scanInProgress = false;
}

module.exports = {
  disconnect,
};
