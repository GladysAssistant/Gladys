const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Handle Tasmota 'stat/+/POWER' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - MQTT message.
 * @param {string} eventType - MQTT topic.
 * @param {Array} events - Resulting events.
 * @example
 * power('tasmota:sonoff-plug', '{"key": "value"}', 'POWER3', []);
 */
function power(deviceExternalId, message, eventType, events) {
  let switchNo = eventType.replace('POWER', '');
  if (switchNo.length > 0) {
    switchNo = `:${switchNo}`;
  }

  events.push({
    device_feature_external_id: `tasmota:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}${switchNo}`,
    state: message === 'ON' ? 1 : 0,
  });
}

module.exports = {
  power,
};
