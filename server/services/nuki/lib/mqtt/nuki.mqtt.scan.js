const { DISCOVERY_TOPIC } = require('../utils/nuki.constants');

/**
 * @description Force MQTT scanning by re-subscribing to topic.
 * @example
 * nukiMQTTHandler.scan();
 */
function scan() {
  // Subscribe to Nuki
  this.mqttService.device.unsubscribe(DISCOVERY_TOPIC);
  this.mqttService.device.subscribe(DISCOVERY_TOPIC, this.handleMessage.bind(this));
}

module.exports = {
  scan,
};
