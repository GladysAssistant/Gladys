const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example handleMessage('zwave2mqtt/zwave2mqtt:device/POWER', 'ON');
 */
function handleMessage(topic, message) {
  logger.debug(`Receive message from topic {topic}: {message}`);
  // const splittedTopic = topic.split('/');
  // events.forEach((event) => this.zwave2mqttHandler.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event));
  return null;
}

module.exports = {
  handleMessage,
};
