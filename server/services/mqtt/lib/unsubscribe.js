const logger = require('../../../utils/logger');

/**
 * @description Unsubscribes to a topic.
 * @param {string} topic - Topic to unsubscribe to.
 * @example
 * unsubscribe('topic/to/unsubscribe');
 */
function unsubscribe(topic) {
  // Check if any device feature is still listening to this topic
  const deviceFeatureStillListening = this.deviceFeatureCustomMqttTopics.some((t) => t.topic === topic);
  // Only unsubscribe from the MQTT broker if no device feature is listening to this topic
  if (this.mqttClient && !deviceFeatureStillListening) {
    logger.info(`Unsubscribing to MQTT topic ${topic}`);
    this.mqttClient.unsubscribe(topic);
  }
  delete this.topicBinds[topic];
}

module.exports = {
  unsubscribe,
};
