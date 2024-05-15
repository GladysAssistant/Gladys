/**
 * @description This will return the zwaveJs device.
 * @param {string} gladysDeviceId - The gladys device id.
 * @returns {object} The zwaveJsDevice.
 * @example zwaveJSUI.getZwaveJsDevice("zwavejs-ui:5");
 */
function getZwaveJsDevice(gladysDeviceId) {
  const deviceId = parseInt(gladysDeviceId.split(':')[1], 10);

  return this.zwaveJSDevices.find((n) => n.id === deviceId);
}

module.exports = {
  getZwaveJsDevice,
};
