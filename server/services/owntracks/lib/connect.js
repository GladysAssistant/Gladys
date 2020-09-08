/**
 * @description Initialiaze service with dependencies and connect to devices.
 * @example
 * connect();
 */
function connect() {
  // Loads MQTT service
  this.mqttService = this.gladys.service.getService('mqtt');

  // Subscribe to Owntracks topics
  this.mqttService.device.subscribe('owntracks/+/+', this.handleMqttMessage.bind(this));
  
}

module.exports = {
  connect,
};
