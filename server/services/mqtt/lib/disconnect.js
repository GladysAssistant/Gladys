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

  // The discovered devices come from the retained configs of the broker we are leaving. Reconnecting
  // to another broker, or to one that no longer holds those configs, would otherwise keep showing
  // them in the Discovery tab. They are replayed on subscription, so the list rebuilds by itself.
  // The state bindings are not touched: they belong to devices the user already created in Gladys.
  this.haDiscoveredDevices = {};
  this.haEntitiesByTopic = {};

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
