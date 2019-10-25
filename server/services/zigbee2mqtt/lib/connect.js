/**
 * @description Initialiaze service with dependencies and connect to devices.
 * @example
 * connect();
 */
function connect() {
  // Loads MQTT service
  this.mqttService = this.gladys.service.getService('mqtt');

  // Subscribe to Zigbee2mqtt topics
  this.mqttService.device.subscribe('zigbee2mqtt/#', this.handleMqttMessage.bind(this));
}

module.exports = {
  connect,
};
