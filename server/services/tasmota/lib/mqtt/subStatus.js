const { EVENTS } = require('../../../../utils/constants');
const { addSelector } = require('../../../../utils/addSelector');
const logger = require('../../../../utils/logger');
const { recursiveSearch, generateExternalId, generateValue } = require('../features');

const addFeature = (device, featureTemplate, command, value) => {
  const featureExternalId = generateExternalId(featureTemplate, command);
  const externalId = `${device.external_id}:${featureExternalId}`;
  const existingFeature = device.features.find((f) => f.external_id === externalId);

  if (existingFeature) {
    logger.debug(`Tasmota: duplicated feature handled for ${externalId}`);
  } else {
    const generatedFeature = featureTemplate.generateFeature(device, command, value);

    if (generatedFeature) {
      const convertedValue = generateValue(featureTemplate, value);

      const feature = {
        ...generatedFeature,
        external_id: externalId,
        selector: externalId,
        last_value: convertedValue,
      };

      addSelector(feature);

      device.features.push(feature);
      return feature;
    }
  }

  return null;
};

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

  recursiveSearch(statusMsg, (featureTemplate, command, value) => {
    const feature = addFeature(device, featureTemplate, command, value);
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
