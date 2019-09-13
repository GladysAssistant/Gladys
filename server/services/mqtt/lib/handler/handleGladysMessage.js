const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example
 * handleGladysMessage(gladys.service.mqtt.client, 'gladys/device/create', '{ message: "content" }');
 */
function handleGladysMessage(topic, message) {
  switch (topic) {
    case 'gladys/master/device/create':
      this.gladys.event.emit(EVENTS.DEVICE.NEW, JSON.parse(message));
      break;
    case 'gladys/master/device/state/update':
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, JSON.parse(message));
      break;
    default:
      logger.info(`MQTT : Gladys topic ${topic} not handled.`);
      break;
  }
}

module.exports = {
  handleGladysMessage,
};
