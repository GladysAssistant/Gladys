const { EVENTS } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');
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
  if (topic === 'gladys/master/device/create') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW, JSON.parse(message));
  } else if (topic.startsWith('gladys/master/device/')) {
    // Topic = gladys/master/device/:device_external_id/feature/:device_feature_external_id/state
    if (!parsedTopic[5]) {
      throw new BadParameters('Device feature external_id is required');
    }
    const event = {
      device_feature_external_id: parsedTopic[5],
      state: parseFloat(message),
    };
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event);
  } else if (topic.startsWith('owntracks/gladys/oneplus5')) {
    logger.debug(`MQTT : Gladys has a message from Owntracks on ${topic} :${message}.`);
    this.gladys.location.create('nicolas', {latitude: 48.5, longitude: 7.5, });
  } else {
    logger.warn(`MQTT : Gladys topic ${topic} not handled.`);
  }
}

module.exports = {
  handleGladysMessage,
};
