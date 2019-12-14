const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Handle Tasmota 'stat/+/SENSOR' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - MQTT message.
 * @param {Array} events - Resulting events.
 * @example
 * sensor('sonoff:sonoff-plug', '{"key": "value"}', []);
 */
function sensor(deviceExternalId, message, events) {
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
}

module.exports = {
  sensor,
};
