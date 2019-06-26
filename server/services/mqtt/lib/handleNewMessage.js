const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - The topic where the message was posted.
 * @param {string} message - The message sent.
 * @example
 * handleNewMessage('/gladys/master/heartbeat', '{}');
 */
function handleNewMessage(topic, message) {
  try {
    switch (topic) {
      case 'gladys/master/device/create':
        this.gladys.event.emit(EVENTS.DEVICE.NEW, JSON.parse(message));
        break;
      default:
        logger.info(`MQTT : Topic ${topic} not handled.`);
        break;
    }
  } catch (e) {
    logger.warn(`Unable to handle new MQTT message in topic ${topic}`);
    logger.warn(e);
  }
}

module.exports = {
  handleNewMessage,
};
