const uuid = require('uuid');
const { loadFeatures } = require('./loadFeatures');

/**
 * @description Converts an MQTT device to a Gladys device.
 * @param {*} device - Zigbee2mqtt device.
 * @param {string} serviceId - Service ID.
 * @returns {*} Device for Gladys.
 * @example
 * convertDevice({ friendly_name: 'name', model: 'featureMapper' });
 */
function convertDevice(device, serviceId) {
  return {
    id: uuid.v4(),
    name: device.friendly_name,
    external_id: device.friendly_name,
    params: [
      {
        name: 'model',
        value: device.model,
      },
    ],
    features: loadFeatures(device.friendly_name, device.model, device.powerSource === 'Battery'),
    should_poll: false,
    service_id: serviceId,
  };
}

module.exports = {
  convertDevice,
};
