const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('./constants');

/**
 * @description Check if device is HTTP.
 * @param {Object} device - Gladys device.
 * @returns {boolean} True is HTTP device.
 * @example
 * tasmota.isHttpDevice({});
 */
function isHttpDevice(device) {
  return (
    device.params.findIndex(
      (p) => p.name === DEVICE_PARAM_NAME.INTERFACE && p.value === DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.INTERFACE].HTTP,
    ) >= 0
  );
}

module.exports = {
  isHttpDevice,
};
