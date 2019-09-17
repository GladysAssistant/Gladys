const logger = require('../../../utils/logger');

/**
 * @description Subscribes to a topic.
 * @param {string} topic - Topic to subscribe to.
 * @param {Function} callback - Function to call on topic reception.
 * @example
 * subscribe('topic/to/subscribe/#', (topic, message) => { console.log(message); });
 */
function subscribe(topic, callback) {
  if (this.mqttClient) {
    logger.info(`Subscribing to MQTT topic ${topic}`);
    this.mqttClient.subscribe(topic);
  }

  this.topicBinds[topic] = callback;
}

module.exports = {
  subscribe,
};
