/**
 * @description Get devices from Gladys according to external id.
 * @param {Array} requestedDevices - Requested devices.
 * @returns {Array} Devices from Gladys memory.
 * @example
 * smartthingsHandler.getDevices(
 *  [
 *    {
 *      externalDeviceId: "partner-device-id-1",
 *    },
 *    {
 *      externalDeviceId: "partner-device-id-2",
 *    },
 *  ]
 * );
 */
function getDevices(requestedDevices = undefined) {
  if (requestedDevices) {
    return requestedDevices.map((requestedDevice) =>
      this.gladys.stateManager.get('deviceByExternalId', requestedDevice.externalDeviceId),
    );
  }
  return Object.values(this.gladys.stateManager.state.device).map((store) => store.get());
}

module.exports = {
  getDevices,
};
