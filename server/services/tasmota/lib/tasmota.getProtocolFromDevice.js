const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('./tasmota.constants');

/**
 * @description Get Tasmota protocol used by device, default is MQTT.
 * @param {object} device - Gladys device.
 * @returns {string} Device protocol.
 * @example
 * tasmota.getProtocolFromDevice({});
 */
function getProtocolFromDevice(device) {
  const protocolParam = device.params.find((p) => p.name === DEVICE_PARAM_NAME.PROTOCOL);
  if (protocolParam) {
    return protocolParam.value;
  }

  // Default is mqtt.
  return DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT;
}

module.exports = {
  getProtocolFromDevice,
};
