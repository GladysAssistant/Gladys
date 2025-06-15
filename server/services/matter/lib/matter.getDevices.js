/**
 * @description Get the devices.
 * @returns {Array} The devices.
 * @example
 * const devices = matterHandler.getDevices();
 */
function getDevices() {
  return this.devices;
}

module.exports = {
  getDevices,
};
