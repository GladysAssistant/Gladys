const { ZWAVE_GATEWAY_PARAM_NAME } = require('./constants');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example connect();
 */
function connect() {
  // Loads MQTT service
  this.mqttService = this.gladys.service.getService('mqtt');

  // Subscribe to Zwave2mqtt topics
  this.mqttService.device.subscribe(ZWAVE_GATEWAY_PARAM_NAME.API_TOPIC, this.handleMessage.bind(this));
  this.mqttService.device.subscribe(ZWAVE_GATEWAY_PARAM_NAME.DEVICE_INFO_TOPIC, this.handleDevicesMessage.bind(this));
}

module.exports = {
  connect,
};
