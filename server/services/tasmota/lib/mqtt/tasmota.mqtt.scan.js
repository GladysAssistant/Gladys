/**
 * @description Force MQTT scanning by re-subscribing to topic.
 * @example
 * scan();
 */
function scan() {
  // Subscribe to Tasmota
  this.mqttService.device.unsubscribe('tele/+/+');
  this.mqttService.device.subscribe('tele/+/+', this.handleMessage.bind(this));
}

module.exports = {
  scan,
};
