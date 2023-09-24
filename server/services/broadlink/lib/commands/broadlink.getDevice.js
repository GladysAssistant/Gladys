const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Get Broadlink device from cache or try to discover it.
 * @param {string} peripheralId - Broadlink device identifier.
 * @returns {Promise<object>} Resolve with device.
 * @example
 * await getDevice('deviceIdentifier');
 */
async function getDevice(peripheralId) {
  let broadlinkDevice = this.broadlinkDevices[peripheralId];

  if (!broadlinkDevice) {
    // Force reload
    await this.init();
    broadlinkDevice = this.broadlinkDevices[peripheralId];
  }

  if (!broadlinkDevice) {
    throw new ServiceNotConfiguredError(`${peripheralId} Broadlink peripheral is not discovered`);
  }

  return broadlinkDevice;
}

module.exports = {
  getDevice,
};
