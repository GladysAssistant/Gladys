const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');
const { DEVICE_EXTERNAL_ID_BASE, DEVICE_IP_ADDRESS, DEVICE_FIRMWARE } = require('../utils/constants');
const { getDeviceName } = require('../utils/getDeviceName');

/**
 * @description Create an eWeLink device for Gladys.
 * @param {string} serviceId - The UUID of the service.
 * @param {Object} device - The eWeLink device.
 * @param {number} channel - The channel of the device to control.
 * @returns {Object} Return Basic device.
 * @example
 * getDevice(serviceId, device, channel);
 */
function getDevice(serviceId, device, channel = 0) {
  const name = getDeviceName(device, channel);

  return {
    service_id: serviceId,
    name,
    model: device.productModel || 'Basic',
    external_id: `${DEVICE_EXTERNAL_ID_BASE}:${device.deviceid}:${channel}`,
    selector: `${DEVICE_EXTERNAL_ID_BASE}:${device.deviceid}:${channel}`,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    features: [
      {
        name: `${name} On/Off`,
        external_id: `${DEVICE_EXTERNAL_ID_BASE}:${device.deviceid}:${channel}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
        selector: `${DEVICE_EXTERNAL_ID_BASE}:${device.deviceid}:${channel}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: false,
        min: 0,
        max: 1,
      },
    ],
    params: [
      {
        name: DEVICE_IP_ADDRESS,
        value: device.ip ? device.ip : '?.?.?.?',
      },
      {
        name: DEVICE_FIRMWARE,
        value: device.params ? device.params.fwVersion : '?.?.?',
      },
    ],
  };
}

module.exports = {
  getDevice,
};
