const logger = require('../../../utils/logger');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @returns {boolean}
 * @example handleMessage('zwave2mqtt/zwave2mqtt:device/POWER', {});
 */
function handleMessage(topic, message) {
  logger.debug(`Receive message from topic ${topic}: ${message}`);
  return true;
}

module.exports = {
  handleMessage,
};
