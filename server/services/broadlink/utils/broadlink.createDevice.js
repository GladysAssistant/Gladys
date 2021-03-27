const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../utils/constants');

/**
 * @description Creates Broadlink plug device.
 * @param {string} name - Plug name.
 * @param {string} model - Plug model.
 * @param {string} mac - Device MAC address.
 * @param {number} nbSwitch - Number of switch on the device.
 * @param {string} serviceId - Broadlink service ID.
 * @example
 * createDevice('myDevice', 'sp1', '23DE5A12', 3, 'broadlink-service-id')
 */
function createDevice(name, model, mac, nbSwitch, serviceId) {
  const externalId = `broadlink:${mac}`;
  const device = {
    name,
    features: [],
    external_id: externalId,
    selector: externalId,
    model,
    service_id: serviceId,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
  };

  for (let i = 0; i < nbSwitch; i += 1) {
    const featureExternalId = `${externalId}:${i}`;
    device.features.push({
      name: `${name}${nbSwitch > 1 ? ` ${i + 1}` : ''}`,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      external_id: featureExternalId,
      selector: featureExternalId,
      min: 0,
      max: 1,
      read_only: false,
      has_feedback: true,
    });
  }

  return device;
}

module.exports = {
  createDevice,
};
