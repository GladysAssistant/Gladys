const logger = require('../../../utils/logger');

/**
 * @description Disconnect to all topics.
 * @example
 * disconnect();
 */
function disconnect() {
  this.connected = false;

  // A Home Assistant discovery burst may have a debounced websocket emit pending: firing it after
  // the service is stopped would push a discovery list nothing is listening for anymore
  if (this.haDiscoveryEmitTimeout) {
    clearTimeout(this.haDiscoveryEmitTimeout);
    this.haDiscoveryEmitTimeout = null;
  }

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
