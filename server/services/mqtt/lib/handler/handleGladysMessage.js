const { EVENTS } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {object} message - The message sent.
 * @example
 * handleGladysMessage('gladys/master/device/create', '{ message: "content" }');
 */
function handleGladysMessage(topic, message) {
  const parsedTopic = topic.split('/');
  if (topic === 'gladys/master/device/create') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW, JSON.parse(message));
  } else if (topic.startsWith('gladys/master/device/')) {
    if (!parsedTopic[5]) {
      throw new BadParameters('Device feature external_id is required');
    }
    // if the message is a text
    if (topic.endsWith('/text')) {
      // Topic = gladys/master/device/:device_external_id/feature/:device_feature_external_id/text
      const event = {
        device_feature_external_id: parsedTopic[5],
        text: message,
      };
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event);
    } else {
      // Or a float state
      // Topic = gladys/master/device/:device_external_id/feature/:device_feature_external_id/state
      const event = {
        device_feature_external_id: parsedTopic[5],
        state: parseFloat(message),
      };
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event);
    }
  } else if (topic.startsWith('gladys/master/scene/')) {
    if (topic.endsWith('/start')) {
      this.gladys.event.emit(EVENTS.SCENE.TRIGGERED, parsedTopic[3]);
    }
  } else {
    logger.warn(`MQTT : Gladys topic ${topic} not handled.`);
  }
}

module.exports = {
  handleGladysMessage,
};
