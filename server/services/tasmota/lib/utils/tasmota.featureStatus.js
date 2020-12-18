const { EVENTS } = require('../../../../utils/constants');
const { recursiveSearch, generateExternalId, generateValue } = require('../features');

const sendEvent = (gladysEvent, deviceExternalId, featureTemplate, fullKey, command, value) => {
  const featureExternalId = generateExternalId(featureTemplate, command, fullKey);

  gladysEvent.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `tasmota:${deviceExternalId}:${featureExternalId}`,
    state: generateValue(featureTemplate, value),
  });
};

/**
 * @description Handle Tasmota 'stat/+/SENSOR' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - Tasmota message.
 * @param {Object} gladysEvent - Gladys event emitter.
 * @param {string} key - Default object key.
 * @returns {any} NULL.
 * @example
 * sensor('tasmota:sonoff-plug', '{"key": "value"}', gladysEvent);
 */
function featureStatus(deviceExternalId, message, gladysEvent, key = undefined) {
  const sensorMsg = JSON.parse(message);

  recursiveSearch(
    sensorMsg,
    (featureTemplate, fullKey, command, value) =>
      sendEvent(gladysEvent, deviceExternalId, featureTemplate, fullKey, command, value),
    key,
  );
  return null;
}

module.exports = {
  featureStatus,
};
