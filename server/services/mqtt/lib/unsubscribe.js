const logger = require('../../../utils/logger');

/**
 * @description Unsubscribes to a topic.
 * @param {string} topic - Topic to unsubscribe to.
 * @example
 * unsubscribe('topic/to/unsubscribe');
 */
function unsubscribe(topic) {
  logger.info(`Unsubscribing to MQTT topic ${topic}`);
  if (this.mqttClient) {
    this.mqttClient.unsubscribe(topic);
  }
  delete this.topicBinds[topic];
}

module.exports = {
  unsubscribe,
};
