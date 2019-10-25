/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  // Unsubscribe to Zigbee2mqtt topics
  this.mqttService.device.unsubscribe('zigbee2mqtt/#');
}

module.exports = {
  disconnect,
};
