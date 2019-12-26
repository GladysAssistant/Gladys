/**
 * @description Return list of devices.
 * @returns {Array} Return array of devices.
 * @example
 * magicdevices.getDevices();
 */
function getDevices() {
  return Object.keys(this.devices).map((deviceId) => this.devices[deviceId]);
}

module.exports = {
  getDevices,
};
