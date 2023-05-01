const { EVENTS } = require('../../../../utils/constants');
const { recursiveSearch, generateExternalId, generateValue } = require('../features');

const sendEvent = (gladysEvent, deviceExternalId, featureTemplate, fullKey, command, value) => {
  const featureExternalId = generateExternalId(featureTemplate, command, fullKey);

  // Check if value is an array
  const arrayValue = typeof value === 'object';

  // If value is array, and feature should be splited
  const multipleFeatures = arrayValue && !featureTemplate.valueAsArray;

  const valueAsArray = multipleFeatures ? value : [value];

  valueAsArray.forEach((val, index) => {
    const externalId = `tasmota:${deviceExternalId}:${featureExternalId}${multipleFeatures ? index + 1 : ''}`;
    gladysEvent.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: externalId,
      state: generateValue(featureTemplate, val),
    });
  });
};

/**
 * @description Handle Tasmota 'stat/+/SENSOR' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - Tasmota message.
 * @param {object} gladysEvent - Gladys event emitter.
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
