const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { status, state, sensor, power } = require('./mqttStat');
/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example
 * handleMqttMessage('stat/tasmota/POWER', 'ON');
 */
function handleMqttMessage(topic, message) {
  const splittedTopic = topic.split('/');
  const eventType = splittedTopic[2];
  const deviceExternalId = splittedTopic[1];
  const events = [];

  switch (eventType) {
    // Power status
    case 'POWER':
    case 'POWER1':
    case 'POWER2': {
      power(deviceExternalId, message, eventType, events);
      break;
    }
    // Sensor status
    case 'SENSOR': {
      sensor(deviceExternalId, message, events);
      break;
    }
    // Device global status
    case 'STATUS': {
      status(deviceExternalId, message, events, this);
      break;
    }
    // Device state topic
    case 'RESULT':
    case 'STATE': {
      state(deviceExternalId, message, events);
      break;
    }
    // Online status
    case 'LWT': {
      this.mqttService.device.publish(`cmnd/${deviceExternalId}/status`);
      break;
    }
    default: {
      logger.info(`MQTT : Tasmota topic ${topic} not handled.`);
    }
  }

  events.forEach((event) => this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event));
  return null;
}

module.exports = {
  handleMqttMessage,
};
