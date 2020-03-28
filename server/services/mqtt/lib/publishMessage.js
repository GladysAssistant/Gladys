const logger = require('../../../utils/logger');

/**
 * @description Publish a message on a topic.
 * @param {string} topic - Topic to publish to.
 * @param {any} message - Message to send.
 * @example
 * publishMessage('cmnd/tasmota/POWER', 'ON');
 */
function publishMessage(topic, message = undefined) {
  this.mqttClient.publish(topic, message, undefined, (err) => {
    if (err) {
      logger.warn(`MQTT - Error publishing to ${topic} : ${err}`);
    }
  });
}

module.exports = {
  publishMessage,
};
