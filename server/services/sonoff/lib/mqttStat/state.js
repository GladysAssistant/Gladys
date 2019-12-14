const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Handle Tasmota 'stat/+/STATE' or 'stat/+/RESULT' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - MQTT message.
 * @param {Array} events - Resulting events.
 * @example
 * state('sonoff:sonoff-plug', '{"key": "value"}', []);
 */
function state(deviceExternalId, message, events) {
  const stateMsg = JSON.parse(message);
  const stateValue = stateMsg.POWER;

  events.push({
    device_feature_external_id: `sonoff:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
    state: stateValue === 'ON' ? 1 : 0,
  });
}

module.exports = {
  state,
};
