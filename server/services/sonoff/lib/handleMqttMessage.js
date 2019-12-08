const logger = require('../../../utils/logger');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const models = require('../models');

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
  const events = [];

  switch (eventType) {
    // Power status
    case 'POWER': {
      events.push({
        device_feature_external_id: `sonoff:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
        state: message === 'ON' ? 1 : 0,
      });
      break;
    }
    // Sensor status
    case 'SENSOR': {
      const sensorMsg = JSON.parse(message);

      const energyMsg = sensorMsg.ENERGY;
      if (energyMsg) {
        if (energyMsg.Current) {
          events.push({
            device_feature_external_id: `sonoff:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.ENERGY}`,
            state: energyMsg.Current,
          });
        }

        if (energyMsg.Power) {
          events.push({
            device_feature_external_id: `sonoff:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.POWER}`,
            state: energyMsg.Power / 1000,
          });
        }

        if (energyMsg.Voltage) {
          events.push({
            device_feature_external_id: `sonoff:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE}`,
            state: energyMsg.Voltage,
          });
        }
      }
      break;
    }
    // Device global status
    case 'STATUS': {
      const statusMsg = JSON.parse(message);
      const statusValue = statusMsg.Status.Power;
      const friendlyName = statusMsg.Status.FriendlyName[0];
      const moduleId = statusMsg.Status.Module;

      const model = models[moduleId];
      if (model) {
        this.mqttDevices[deviceExternalId] = {
          name: friendlyName,
          external_id: `sonoff:${deviceExternalId}`,
          features: model.getFeatures(),
          model: model.getModel(),
          service_id: this.serviceId,
          should_poll: false,
        };

        events.push({
          device_feature_external_id: `sonoff:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
          state: statusValue,
        });
      } else {
        logger.warn(`MQTT : Sonoff model ${moduleId} (${friendlyName}) not managed`);
      }

      break;
    }
    // Device state topic
    case 'RESULT':
    case 'STATE': {
      const stateMsg = JSON.parse(message);
      const stateValue = stateMsg.POWER;

      events.push({
        device_feature_external_id: `sonoff:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
        state: stateValue === 'ON' ? 1 : 0,
      });
      break;
    }
    // Online status
    case 'LWT': {
      this.mqttService.device.publish(`cmnd/${deviceExternalId}/status`);
      break;
    }
    default: {
      logger.info(`MQTT : Sonoff topic ${topic} not handled.`);
    }
  }

  events.forEach((event) => this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event));
  return null;
}

module.exports = {
  handleMqttMessage,
};
