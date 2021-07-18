const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { convertValue } = require('./utils/convertValue');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example handleDevicesMessage('zwave2mqtt/nodeID_37/37/0/currentValue', [{"id": 118,}]);
 */
function handleDevicesMessage(topic, message) {
  logger.debug(`Receive message from topic ${topic}: ${message}`);
  const splittedTopic = topic.split('/');
  const nodeId = splittedTopic[1];
  const featureExternalId = topic.replace('zwave2mqtt/', 'zwave2mqtt:');

  const existingDevice = this.gladys.stateManager.get('deviceByExternalId', `zwave2mqtt:${nodeId}`);
  if (existingDevice) {
    existingDevice.features
      .filter((feature) => feature.external_id === featureExternalId)
      .map((feature) => {
        const newState = {
          device_feature_external_id: `${feature.external_id}`,
          state: convertValue(feature.type, message),
        };
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, newState);
        return newState;
      });
  } else {
    logger.warn(`Zwave2mqtt device ${nodeId} not configured in Gladys.`);
  }
}

module.exports = {
  handleDevicesMessage,
};
