const { DEVICE_EXTERNAL_ID_BASE } = require('./ecovacs.constants');

/**
 * @description Get the external ID of the Ecovacs device.
 * @param {object} device - The Ecovacs device.
 * @returns {string} Return the built external ID of the Gladys device.
 * @example
 * getExternalId(device);
 */
function getExternalId(device) {
  return [DEVICE_EXTERNAL_ID_BASE, device.pid, device.deviceNumber].join(':');
}

/**
 * @description Parse the external ID of the Gladys device.
 * @param {string} externalId - External ID of the Gladys device.
 * @returns {object} Return the prefix, the device PID, the channel count and the type.
 * @example
 * parseExternalId('ecovacs:5c19a8f3a1e6ee0001782247:0');
 */
function parseExternalId(externalId) {
  const [prefix, devicePid, deviceNumber] = externalId.split(':');
  return { prefix, devicePid, deviceNumber };
}

module.exports = {
  getExternalId,
  parseExternalId,
};
