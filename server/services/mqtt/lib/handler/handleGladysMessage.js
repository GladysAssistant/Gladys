const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example
 * handleGladysMessage('gladys/device/create', '{ message: "content" }');
 */
function handleGladysMessage(topic, message) {
  const parsedTopic = topic.split('/');
  // Topic = gladys/master/device/:device_external_id/feature/:device_feature_external_id/state
  if (topic.startsWith('gladys/master/device/')) {
    const event = {
      device_feature_external_id: parsedTopic[5],
      state: message,
    };
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event);
  } else {
    logger.warn(`MQTT : Gladys topic ${topic} not handled.`);
  }
}

module.exports = {
  handleGladysMessage,
};
