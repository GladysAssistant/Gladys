const logger = require('../../../utils/logger');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - The topic where the message was posted.
 * @param {string} message - The message sent.
 * @example
 * handleNewMessage('/zwave/#', '{}');
 */
async function handleNewMessage(topic, message) {
  logger.debug(`Receives MQTT message from ${topic}`);

  try {
    const parsedMessage = JSON.parse(message);
    // On list of devices received
    if (topic === 'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/getNodes') {
      await this.onNewDeviceDiscover(parsedMessage);
    } else if (topic === 'zwave/_EVENTS/ZWAVE_GATEWAY-zwave-js-ui/node/node_value_updated') {
      await this.onNodeValueUpdated(parsedMessage);
    }
  } catch (e) {
    logger.warn(`Unable to handle new MQTT message in topic ${topic}`);
    logger.warn(e);
  }
}

module.exports = {
  handleNewMessage,
};
