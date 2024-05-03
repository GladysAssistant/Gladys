const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

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
    // If debug mode is enabled, send message to UI
    if (this.debugMode) {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.MQTT.DEBUG_NEW_MQTT_MESSAGE,
        payload: {
          topic,
          message,
        },
      });
    }

    let forwardedMessage = false;

    // foreach topic, we see if it matches
    Object.keys(this.topicBinds).forEach((key) => {
      const regexKey = key.replace('+', '[^/]+').replace('#', '.+');
      if (topic.match(regexKey)) {
        forwardedMessage = true;
        this.topicBinds[key](topic, message);
      }
    }, this);

    // Handle custom device listener
    const customListenersFound = this.deviceFeatureCustomMqttTopics.filter((t) => topic.match(t.regex_key));
    customListenersFound.forEach((foundCustomListener) => {
      forwardedMessage = true;
      this.handleDeviceCustomTopicMessage(
        topic,
        message,
        foundCustomListener.device_feature_id,
        foundCustomListener.object_path,
      );
    });

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
