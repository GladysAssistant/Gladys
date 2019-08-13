const { EVENTS } = require('../../../../utils/constants');
const { devicestate } = require('./devicestate');
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
    case 'gladys/master/state/create':
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, JSON.parse(message));
      break;
    case 'gladys/master/devicestate/create':
      devicestate(this, JSON.parse(message));
      break;
    default:
      logger.info(`MQTT : Gladys topic ${topic} not handled.`);
      break;
  }
}

module.exports = {
  handleGladysMessage,
};
