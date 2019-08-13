const logger = require('../../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const { convertToDevice } = require('./convertToDevice');

/**
 * @description Handle a new message receive in MQTT.
 * @param {Object} mqttHandler - The Gladys MQTT client.
 * @param {string} topic - MQTT topic.
 * @param {string[]} splittedTopic - MQTT topic splitted at each '/'.
 * @param {Object} message - The message sent.
 * @example
 * zigbee2mqttTopics(gladys.service.mqtt.client, 'zigbee2mqtt/AQUARA', ['zigbee2mqtt', 'AQUARA'], '{}');
 */
module.exports = function zigbee2mqttTopics(mqttHandler, topic, splittedTopic, message) {
  switch(topic) {
    case 'zigbee2mqtt/bridge/config/devices': {
      const deviceArray = JSON.parse(message);

      const gladysDevices = deviceArray
        .filter(d => d.type === 'EndDevice')
        .map(d => convertToDevice(d));

      mqttHandler.gladys.event.emit(EVENTS.WEBSOCKET, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.SCAN,
        payload: gladysDevices,
      });
      break;
    }
    default: {
      logger.info(`MQTT : Zigbee2mqtt topic ${topic} not handled.`);
    }
  }
};
