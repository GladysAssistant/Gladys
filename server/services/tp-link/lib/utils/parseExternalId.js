/**
 * @description Parse the external id and return the plug ID.
 * @param {string} externalId - External id of the device.
 * @returns {string} Return the deviceId.
 * @example
 * parseExternalId('tp-link-plug:1');
 */
function parseExternalId(externalId) {
  const parsedExternalId = externalId.split(':');
  const deviceId = parsedExternalId[1];
  return deviceId;
}

module.exports = {
  parseExternalId,
};
