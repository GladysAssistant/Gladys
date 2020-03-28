/**
 * @description Force MQTT scanning by re-subscribing to topic.
 * @example
 * forceScan();
 */
function forceScan() {
  // Subscribe to Tasmota
  this.mqttService.device.unsubscribe('tele/+/+');
  this.mqttService.device.subscribe('tele/+/+', this.handleMqttMessage.bind(this));
}

module.exports = {
  forceScan,
};
