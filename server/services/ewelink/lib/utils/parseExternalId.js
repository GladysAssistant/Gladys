/**
 * @description Parse the external ID and return the device ID.
 * @param {string} externalId - External ID of the device.
 * @returns {Object} Return the prefix, the device ID and the channel count.
 * @example
 * parseExternalId('eWeLink:100069d0d4:4');
 */
function parseExternalId(externalId) {
  const [prefix, deviceId, channelString] = externalId.split(':');
  const channel = channelString !== '0' ? parseInt(channelString, 10) : 1;

  return { prefix, deviceId, channel };
}

module.exports = {
  parseExternalId,
};
