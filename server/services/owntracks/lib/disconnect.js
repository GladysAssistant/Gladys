/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  // Unsubscribe to Owntracks topics
  this.mqttService.device.unsubscribe('owntracks/+/+');
}

module.exports = {
  disconnect,
};
