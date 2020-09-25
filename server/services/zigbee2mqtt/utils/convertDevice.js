const { loadFeatures } = require('./loadFeatures');

/**
 * @description Converts an MQTT device to a Gladys device.
 * @param {*} device - Zigbee2mqtt device.
 * @param {string} serviceId - Service ID.
 * @returns {*} Device for Gladys.
 * @example
 * convertDevice({ friendly_name: 'name', model: 'featureMapper' }, '6a37dd9d-48c7-4d09-a7bb-33f257edb78d');
 */
function convertDevice(device, serviceId) {
  const features = loadFeatures(device.friendly_name, device.model, device.powerSource === 'Battery');

  if (features.length === 0) {
    return null;
  }

  return {
    name: device.friendly_name,
    external_id: `zigbee2mqtt:${device.friendly_name}`,
    model: device.model,
    features,
    should_poll: false,
    service_id: serviceId,
  };
}

module.exports = {
  convertDevice,
};
