const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { mqttTopicMatches } = require('./mqttTopicMatches');

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
      if (mqttTopicMatches(key, topic)) {
        forwardedMessage = true;
        this.topicBinds[key](topic, message);
      }
    }, this);

    // Handle custom device listener. Match with mqttTopicMatches like the core
    // bindings above: the old regex was only built from the first "+" of the
    // filter and was not anchored, so later wildcards stayed literal and any
    // topic with the filter as prefix matched.
    const customListenersFound = this.deviceFeatureCustomMqttTopics.filter((t) => mqttTopicMatches(t.topic, topic));
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
