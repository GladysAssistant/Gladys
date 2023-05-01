const { DEVICE_EXTERNAL_ID_BASE } = require('./constants');

/**
 * @description Get the external ID of the eWeLink device.
 * @param {object} device - The eWeLink device.
 * @returns {string} Return the external ID of the Gladys device.
 * @example
 * getExternalId(device, 1);
 */
function getExternalId(device) {
  return [DEVICE_EXTERNAL_ID_BASE, device.deviceid].join(':');
}

/**
 * @description Parse the external ID of the Gladys device.
 * @param {string} externalId - External ID of the Gladys device.
 * @returns {object} Return the prefix, the device ID, the channel count and the type.
 * @example
 * parseExternalId('eWeLink:100069d0d4:power:4');
 */
function parseExternalId(externalId) {
  const [prefix, deviceId, type, channelString] = externalId.split(':');
  const channel = parseInt(channelString || '0', 10);
  return { prefix, deviceId, type, channel };
}

module.exports = {
  getExternalId,
  parseExternalId,
};
