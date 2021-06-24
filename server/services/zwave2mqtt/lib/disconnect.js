const { DEVICE_PARAM_NAME } = require('./constants');

/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  // Unsubscribe to Zwave2mqtt topics
  this.mqttService.device.unsubscribe(DEVICE_PARAM_NAME.TOPIC);
  this.mqttService.device.unsubscribe(DEVICE_PARAM_NAME.DEVICE_INFO_TOPIC);
  this.mqttService.device.unsubscribe(DEVICE_PARAM_NAME.API_TOPIC);
}

module.exports = {
  disconnect,
};
