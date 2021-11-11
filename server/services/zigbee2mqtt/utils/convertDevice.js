const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../server/utils/constants');
const { mapDefinition } = require('./features/mapDefinition');

/**
 * @description Converts an MQTT device to a Gladys device.
 * @param {Object} device - Zigbee2mqtt device.
 * @param {string} serviceId - Service ID.
 * @returns {Object} Device for Gladys.
 * @example
 * convertDevice({ friendly_name: 'name', definition: {} }, '6a37dd9d-48c7-4d09-a7bb-33f257edb78d');
 */
function convertDevice(device, serviceId) {
  const { friendly_name: name, definition = {} } = device;
  const { model } = definition;
  const features = mapDefinition(name, definition);

  // Device is not managed if no feature found, or only battery feature is available.
  const supported = features.findIndex((f) => f.category !== DEVICE_FEATURE_CATEGORIES.BATTERY) >= 0;

  const gladysDevice = {
    name,
    model,
    external_id: `zigbee2mqtt:${name}`,
    features,
    should_poll: false,
    service_id: serviceId,
    supported,
  };

  logger.debug(`Device ${name} / model ${model} ${supported ? '' : 'NOT'} managed by Gladys`);
  return gladysDevice;
}

module.exports = {
  convertDevice,
};
