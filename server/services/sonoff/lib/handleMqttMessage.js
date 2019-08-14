const uuid = require('uuid');
const logger = require('../../../utils/logger');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { featureConverter } = require('../utils/featureConverter');
const { paramsConverter } = require('../utils/paramsConverter');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example
 * handleMqttMessage('stat/sonoff/POWER', 'ON');
 */
function handleMqttMessage(topic, message) {
  const splittedTopic = topic.split('/');
  const eventType = splittedTopic[2];
  const deviceExternalId = splittedTopic[1];
  let event;

  switch (eventType) {
    // Power status
    case 'POWER': {
      event = {
        device_feature_external_id: `${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${
          DEVICE_FEATURE_TYPES.SWITCH.BINARY
        }`,
        state: message === 'ON' ? 1 : 0,
      };
      break;
    }
    // Sensor status
    case 'SENSOR': {
      const sensorMsg = JSON.parse(message);

      event = {
        device_feature_external_id: `${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${
          DEVICE_FEATURE_TYPES.SWITCH.POWER
        }`,
        state: sensorMsg.ENERGY.Current,
      };
      break;
    }
    // Device global status
    case 'STATUS': {
      const statusMsg = JSON.parse(message);
      const statusValue = statusMsg.Status.Power;

      this.mqttDevices[deviceExternalId] = {
        name: statusMsg.Status.FriendlyName[0],
        external_id: deviceExternalId,
        features: featureConverter(uuid, statusMsg.Status.Module, statusMsg.Status.FriendlyName[0], deviceExternalId),
        params: paramsConverter(statusMsg.Status.Module),
        service_id: this.serviceId,
        should_poll: false,
        id: uuid.v4(),
      };

      event = {
        device_feature_external_id: `${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${
          DEVICE_FEATURE_TYPES.SWITCH.BINARY
        }`,
        state: statusValue,
      };
      break;
    }
    // Device state topic
    case 'STATE': {
      const stateMsg = JSON.parse(message);
      const stateValue = stateMsg.POWER;

      event = {
        device_feature_external_id: `${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${
          DEVICE_FEATURE_TYPES.SWITCH.BINARY
        }`,
        state: stateValue === 'ON' ? 1 : 0,
      };
      break;
    }
    // Online status
    case 'LWT': {
      this.mqttService.client.publish(`cmnd/${deviceExternalId}/status`);
      break;
    }
    default: {
      logger.info(`MQTT : Sonoff topic ${topic} not handled.`);
    }
  }

  if (event) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event);
  }
}

module.exports = {
  handleMqttMessage,
};
