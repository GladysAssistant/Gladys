const { mapDefinition } = require('./features/mapDefinition');
const { mapDefinitionParameters } = require('./parameters/mapDefinitionParameters');

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
  const params = mapDefinitionParameters(definition);

  const gladysDevice = {
    name,
    model,
    external_id: `zigbee2mqtt:${name}`,
    features,
    should_poll: false,
    service_id: serviceId,
    params,
  };

  return gladysDevice;
}

module.exports = {
  convertDevice,
};
