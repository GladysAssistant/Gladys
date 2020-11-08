const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { convertDevice } = require('../utils/convertDevice');
const { convertValue } = require('../utils/convertValue');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example
 * handleMqttMessage('stat/zigbee2mqtt/POWER', 'ON');
 */
function handleMqttMessage(topic, message) {
  switch (topic) {
    case 'zigbee2mqtt/bridge/config/devices': {
      // Keep only "final/end" devices
      const devices = JSON.parse(message);
      const convertedDevices = devices
        .map((d) => {
          const existingDevice = this.gladys.stateManager.get('deviceByExternalId', `zigbee2mqtt:${d.friendly_name}`);
          return existingDevice || convertDevice(d, this.serviceId);
        })
        .filter((d) => d);

      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
        payload: convertedDevices,
      });
      break;
    }
    case 'zigbee2mqtt/bridge/config': {
      // Keep only "permit_join" value
      const config = JSON.parse(message);
      this.z2mPermitJoin = config.permit_join;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
        payload: this.z2mPermitJoin,
      });
      break;
    }
    default: {
      const splittedTopic = topic.split('/');
      if (splittedTopic.length === 2) {
        const friendlyName = splittedTopic[1];
        const incomingFeatures = JSON.parse(message);

        Object.keys(incomingFeatures).forEach((featureName) => {
          const feature = this.gladys.stateManager.get(
            'deviceFeatureByExternalId',
            `zigbee2mqtt:${friendlyName}:${featureName}`,
          );

          if (feature) {
            const newState = {
              device_feature_external_id: `${feature.external_id}`,
              state: convertValue(featureName, incomingFeatures[featureName]),
            };
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, newState);
          } else {
            logger.warn(`Zigbee2mqtt device ${splittedTopic[1]}, feature ${featureName} not found.`);
          }
        });
      } else {
        logger.info(`Zigbee2mqtt topic ${topic} not handled.`);
      }
    }
  }
}

module.exports = {
  handleMqttMessage,
};
