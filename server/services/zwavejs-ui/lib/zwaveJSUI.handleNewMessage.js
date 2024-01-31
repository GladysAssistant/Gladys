const get = require('get-value');
const { EVENTS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { STATES } = require('./constants');
const { cleanNames, getDeviceFeatureExternalId } = require('../utils/convertToGladysDevice');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - The topic where the message was posted.
 * @param {string} message - The message sent.
 * @example
 * handleNewMessage('/zwave/#', '{}');
 */
function handleNewMessage(topic, message) {
  logger.debug(`Receives MQTT message from ${topic}`);

  try {
    const splittedTopic = topic.split('/');
    const parsedMessage = JSON.parse(message);
    // On list of devices received
    if (topic === 'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/getNodes') {
      this.onNewDeviceDiscover(parsedMessage);
    } else if (splittedTopic.length === 7) {
      // trying to match example: zwave/living-room/my-sensor/notification/endpoint_0/Access_Control/Door_state_simple
      const [, , , comClassName, endpoint, property, propertyKey] = splittedTopic;
      const [, endpointNumber] = endpoint.split('_');
      const comClassNameClean = cleanNames(comClassName);
      const propertyClean = cleanNames(property);
      const propertyKeyClean = cleanNames(propertyKey);
      const valueConverted = get(
        STATES,
        `${comClassNameClean}.${propertyClean}.${propertyKeyClean}.${parsedMessage.value}`,
      );
      if (valueConverted !== undefined) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: getDeviceFeatureExternalId(
            parsedMessage.nodeId,
            endpointNumber,
            comClassNameClean,
            propertyClean,
            propertyKeyClean,
          ),
          state: valueConverted,
        });
      }
    }
  } catch (e) {
    logger.warn(`Unable to handle new MQTT message in topic ${topic}`);
    logger.warn(e);
  }
}

module.exports = {
  handleNewMessage,
};
