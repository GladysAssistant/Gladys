const logger = require('../../../utils/logger');
// const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example handleDevicesMessage('zwave2mqtt/nodeID_37/37/0/currentValue', [{"id": 118,}]);
 */
function handleDevicesMessage(topic, message) {
  logger.debug(`Receive message from topic {topic}: {message}`);
  // const splittedTopic = topic.split('/');
}

module.exports = {
  handleDevicesMessage,
};
