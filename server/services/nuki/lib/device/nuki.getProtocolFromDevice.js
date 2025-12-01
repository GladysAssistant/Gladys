const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../utils/nuki.constants');
const { getDeviceParam } = require('../../../../utils/device');

/**
 * @description Get Nuki protocol used by device, default is MQTT.
 * @param {object} device - Gladys device.
 * @returns {string} Device protocol.
 * @example
 * nuki.getProtocolFromDevice({});
 */
function getProtocolFromDevice(device) {
  const protocol = getDeviceParam(device, DEVICE_PARAM_NAME.PROTOCOL);
  if (!protocol) {
    return DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT;
  }
  return protocol;
}

module.exports = {
  getProtocolFromDevice,
};
