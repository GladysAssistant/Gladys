/**
 * @private
 * @description Set the current state of a device.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The deviceFeature to control.
 * @param {string|number} value - The new state to set.
 * @returns {Promise} Resolving with deviceFeature state.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  // Implement the way you send a new value to the real device
  //  - call HTTP API
  //  - send a message to a MQTT broker
  //  - ...
  return value;
}

module.exports = setValue;
