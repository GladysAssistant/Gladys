/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  // Unsubscribe to Sonoff topics
  this.mqttService.client.unsubscribe('stat/+/+');
  this.mqttService.client.unsubscribe('tele/+/+');
}

module.exports = {
  disconnect,
};
