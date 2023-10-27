const logger = require('../../../utils/logger');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - The topic where the message was posted.
 * @param {string} message - The message sent.
 * @example
 * handleNewMessage('/gladys/master/heartbeat', '{}');
 */
function handleNewMessage(topic, message) {
  logger.debug(`Receives MQTT message from ${topic} : ${message}`);

  try {
    let forwardedMessage = false;

    // foreach topic, we see if it matches
    Object.keys(this.topicBinds).forEach((key) => {
      const regexKey = key.replace('+', '[^/]+').replace('#', '.+');
      if (topic.match(regexKey)) {
        forwardedMessage = true;
        this.topicBinds[key](topic, message);
      }
    }, this);

    if (!forwardedMessage) {
      logger.warn(`No subscription found for MQTT topic ${topic}`);
    }
  } catch (e) {
    logger.warn(`Unable to handle new MQTT message in topic ${topic}`);
    logger.warn(e);
  }
}

module.exports = {
  handleNewMessage,
};
