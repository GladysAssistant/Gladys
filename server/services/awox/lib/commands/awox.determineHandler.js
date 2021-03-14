/**
 * @description Get device from Bluetooth service and adapt it as AwoX device.
 * @param {Object} device - Gladys device.
 * @param {Object} manufacturerData - Decrypted advertising message.
 * @returns {string} Returns compatible handler name, might be undefined.
 * @example
 * awox.determineHandler({ external_id: 'bluetooth:d03975bc5a71' });
 */
function determineHandler(device, manufacturerData) {
  return Object.keys(this.handlers).find((type) => this.handlers[type].isSupportedDevice(device, manufacturerData));
}

module.exports = {
  determineHandler,
};
