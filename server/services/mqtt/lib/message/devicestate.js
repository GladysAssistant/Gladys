const { EVENTS } = require('../../../../utils/constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {Object} mqttHandler - The Gladys MQTT client.
 * @param {Object} message - The message sent.
 * @example
 * devicestate(gladys.service.mqtt.client, { identifier: 'deviceExternalId', type: 'temp', state: {value: 30} });
 */
function devicestate(mqttHandler, message) {
  // Prepare new state event
  const event = {
    device_feature_external_id: `${message.identifier}:${message.type}`,
    state: message.state.value,
  };

  mqttHandler.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event);
}

module.exports = {
  devicestate,
};
