/**
 * @description This will return the Gladys device.
 * @param {string} nodeId - The gladys device id.
 * @returns {object} The Gladys Device.
 * @example zwaveJSUI.getDevice('zwavejs-ui:5');
 */
function getDevice(nodeId) {
  return this.devices.find((n) => n.external_id === nodeId);
}

module.exports = {
  getDevice,
};
