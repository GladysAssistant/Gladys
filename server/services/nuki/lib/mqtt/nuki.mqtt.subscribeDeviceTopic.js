const logger = require('../../../../utils/logger');

/**
 * @description Subscribe to device Nuki MQTT Topic.
 * @param {object} device - Gladys device.
 * @example
 * nukiMQTTHandler.subscribeDeviceTopic(device);
 */
function subscribeDeviceTopic(device) {
  const topic = `nuki/${device.external_id.split(':')[1]}/#`;
  logger.debug(`Subscribe to ${topic}`);
  this.mqttService.device.subscribe(topic, this.handleMessage.bind(this));
}

module.exports = {
  subscribeDeviceTopic,
};
