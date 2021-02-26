const { loadFeatures } = require('./loadFeatures');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../server/utils/constants');

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

  // Not managed device
  if (features.length === 0 || (features.length === 1 && features[0].category === DEVICE_FEATURE_CATEGORIES.BATTERY)) {
    const gladysDevice = {
      name: device.friendly_name,
      external_id: `zigbee2mqtt:${device.friendly_name}`,
      model: device.model,
      features,
      should_poll: false,
      service_id: serviceId,
      supported: false,
    };
    logger.debug(`Device ${device.friendly_name} / model ${device.model} NOT managed by Gladys`);
    logger.debug(gladysDevice);
    return gladysDevice;
  }

  const gladysDevice = {
    name: device.friendly_name,
    external_id: `zigbee2mqtt:${device.friendly_name}`,
    model: device.model,
    features,
    should_poll: false,
    service_id: serviceId,
    supported: true,
  };
  logger.debug(`Device ${device.friendly_name} / model ${device.model} managed by Gladys`);
  logger.debug(gladysDevice);
  return gladysDevice;
}

module.exports = {
  convertDevice,
};
