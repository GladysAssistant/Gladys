const { EVENTS } = require('../../../../utils/constants');
const { recursiveSearch, addFeature } = require('../features');

/**
 * @description Handle Tasmota 'stat/+/STATUS' topics to create device features.
 * @param {Object} device - Relative device.
 * @param {string} message - MQTT message.
 * @param {Object} gladysEvent - Gladys event manager.
 * @returns {any} NULL.
 * @example
 * subStatus(device, '{"key": "value"}');
 */
function subStatus(device, message, gladysEvent) {
  const statusMsg = JSON.parse(message);

  recursiveSearch(statusMsg, (featureTemplate, fullKey, command, value) => {
    const feature = addFeature(device, featureTemplate, fullKey, command, value);
    if (feature) {
      gladysEvent.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: feature.external_id,
        state: feature.last_value,
      });
    }
  });
  return null;
}

module.exports = {
  subStatus,
};
