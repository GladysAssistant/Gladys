/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
function connect() {
  // Loads MQTT service
  this.mqttService = this.tasmotaHandler.gladys.service.getService('mqtt');

  // Subscribe to Tasmota topics
  this.mqttService.device.subscribe('stat/+/+', this.handleMessage.bind(this));
  this.mqttService.device.subscribe('tele/+/+', this.handleMessage.bind(this));
}

module.exports = {
  connect,
};
