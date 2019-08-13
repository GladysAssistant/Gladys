/**
 * @description Initialiaze service with dependencies and connect to devices.
 * @example
 * connect();
 */
function connect() {
  // Loads MQTT service
  this.mqttService = this.gladys.service.getService('mqtt');

  // Subscribe to Sonoff topics
  this.mqttService.client.subscribe('stat/+/+', this.handleMqttMessage.bind(this));
  this.mqttService.client.subscribe('tele/+/+', this.handleMqttMessage.bind(this));
}

module.exports = {
  connect,
};
