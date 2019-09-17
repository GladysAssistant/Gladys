const logger = require('../../../utils/logger');

/**
 * @description Publish a message on a topic.
 * @param {string} topic - Topic to publish to.
 * @param {any} message - Message to send.
 * @example
 * publish('topic/to/send/to', 'MyMessage');
 */
function publish(topic, message = undefined) {
  if (this.mqttClient) {
    this.mqttClient.publish(topic, message, undefined, (err) => {
      if (err) {
        logger.warn(`MQTT - Error publishing to ${topic} : ${err}`);
      }
    });
  }
}

module.exports = {
  publish,
};
