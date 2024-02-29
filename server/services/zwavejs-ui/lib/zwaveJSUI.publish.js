const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Publish a MQTT message.
 * @param {string} topic - MQTT Topic.
 * @param {string} message - MQTT message.
 * @example zwaveJSUI.publish('zwave/test', '{}');
 */
function publish(topic, message) {
  if (!this.mqttClient) {
    throw new ServiceNotConfiguredError('MQTT is not configured.');
  }
  logger.debug(`Publishing MQTT message on topic ${topic}`);
  this.mqttClient.publish(topic, message, undefined, (err) => {
    if (err) {
      logger.warn(`MQTT - Error publishing to ${topic} : ${err}`);
    }
  });
}

module.exports = {
  publish,
};
