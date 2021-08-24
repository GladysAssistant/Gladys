const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { ZWAVE_GATEWAY_PARAM_NAME } = require('./constants');

/**
 * @description Filter client/zwave messages
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example messageFilter('', {});
 */
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
  if (!this.mqttService.device.configured) {
    throw new ServiceNotConfiguredError('MQTT is not configured.');
  }
  if (!this.mqttService.device.connected) {
    logger.info(`Zwave2mqtt is starting MQTT service.`);
    this.mqttService.start();
  }
  // Subscribe to Zwave2mqtt topics
  this.mqttService.device.subscribe(ZWAVE_GATEWAY_PARAM_NAME.DEVICE_INFO_TOPIC, messageFilter.bind(this));
}
module.exports = {
  connect,
};
