/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  // Unsubscribe to Tasmota topics
  this.mqttService.device.unsubscribe('stat/+/+');
  this.mqttService.device.unsubscribe('tele/+/+');
}

module.exports = {
  disconnect,
};
