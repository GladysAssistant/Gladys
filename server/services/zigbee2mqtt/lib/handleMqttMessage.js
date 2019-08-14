const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { convertDevice } = require('../utils/convertDevice');

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
        .filter((d) => d.type === 'EndDevice')
        .map((d) => {
          const existingDevice = this.gladys.stateManager.get('deviceByExternalId', d.friendly_name);
          return existingDevice || convertDevice(d, this.serviceId);
        });

      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
        payload: convertedDevices,
      });
      break;
    }
    default: {
      const splittedTopic = topic.split('/');
      if (splittedTopic.length === 2) {
        const device = this.gladys.stateManager.get('deviceByExternalId', splittedTopic[1]);
        if (device) {
          const incomingFeatures = JSON.parse(message);

          device.features.forEach((feature) => {
            const featureCategory = feature.category.split('-')[0];
            if (incomingFeatures[featureCategory]) {
              const newState = {
                device_feature_external_id: `${feature.external_id}`,
                state: incomingFeatures[featureCategory],
              };
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, newState);
            } else {
              logger.info(`MQTT : Zigbee2mqtt device ${splittedTopic[1]}, feature ${featureCategory} not found.`);
            }
          });
        } else {
          logger.info(`MQTT : Zigbee2mqtt device ${splittedTopic[1]} not found.`);
        }
      } else {
        logger.info(`MQTT : Zigbee2mqtt topic ${topic} not handled.`);
      }
    }
  }
}

module.exports = {
  handleMqttMessage,
};
