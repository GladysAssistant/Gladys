/**
 * @private
 * @description Get list of devices.
 * @returns {Array} Return array of devices.
 * @example
 * getDevices();
 */
function getDevices() {
  return Object.keys(this.devices).map((k) => this.devices[k]);
}

module.exports = {
  getDevices,
};
