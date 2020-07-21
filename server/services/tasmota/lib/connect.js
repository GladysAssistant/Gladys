/**
 * @description Initialiaze service with dependencies and connect to devices.
 * @example
 * connect();
 */
function connect() {
  // Loads MQTT service
  this.mqttService = this.gladys.service.getService('mqtt');

  // Subscribe to Tasmota topics
  this.mqttService.device.subscribe('stat/+/+', this.handleMqttMessage.bind(this));
  this.mqttService.device.subscribe('tele/+/+', this.handleMqttMessage.bind(this));
}

module.exports = {
  connect,
};
