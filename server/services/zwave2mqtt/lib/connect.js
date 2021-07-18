const { ZWAVE_GATEWAY_PARAM_NAME } = require('./constants');

function messageFilter(topic, message) {
  if (topic.startsWith(ZWAVE_GATEWAY_PARAM_NAME.CLIENT_TOPIC)) {
    this.handleMessage(topic, message);
  } else {
    this.handleDevicesMessage(topic, message);
  }
}

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example connect();
 */
function connect() {
  // Loads MQTT service
  this.mqttService = this.gladys.service.getService('mqtt');

  // Subscribe to Zwave2mqtt topics
  this.mqttService.device.subscribe(ZWAVE_GATEWAY_PARAM_NAME.DEVICE_INFO_TOPIC, messageFilter.bind(this));
}
module.exports = {
  connect,
};
