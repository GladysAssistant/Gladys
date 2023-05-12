/**
 * @description return a list of the rflink devices discovered by the gateway
 * @example
 * rflink.getNewDevices();
 * @returns {object} Devices.
 */
function getNewDevices() {
  const devices = this.newDevices;
  return devices;
}

module.exports = {
  getNewDevices,
};
