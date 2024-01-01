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
    const parsedMessage = JSON.parse(message);
    // On list of devices received
    if (topic === 'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/getNodes') {
      this.onNewDeviceDiscover(parsedMessage);
    } else if (topic === 'zwave/_EVENTS/ZWAVE_GATEWAY-zwave-js-ui/node/node_value_updated') {
      // A value has been updated: https://zwave-js.github.io/node-zwave-js/#/api/node?id=quotvalue-addedquot-quotvalue-updatedquot-quotvalue-removedquot
      const node = parsedMessage.data[0];
      const updatedValue = parsedMessage.data[1];
      const { commandClassName, property, propertyKey, endpoint, newValue } = updatedValue;
      const comClassNameClean = cleanNames(commandClassName);
      const propertyClean = cleanNames(property);
      const propertyKeyClean = cleanNames(propertyKey);
      let statePath = `${comClassNameClean}.${propertyClean}`;
      if (propertyKeyClean !== '') {
        statePath += `.${propertyKeyClean}`;
      }
      const valueConverted = get(
        STATES,
        `${statePath}.${newValue}`,
      );
      if (valueConverted !== undefined) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: getDeviceFeatureExternalId(
            node.location,
            node.name,
            endpoint,
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
