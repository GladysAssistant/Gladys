/**
 * @description Parse the external id and return the lamp ID.
 * @param {string} externalId - External id of the device.
 * @returns {number} Return the lamp ID.
 * @example
 * parseExternalId('philips-hue:1');
 */
function parseExternalId(externalId) {
  const parsedExternalId = externalId.split(':');
  const lightId = parsedExternalId[1];
  return parseInt(lightId, 10);
}

module.exports = {
  parseExternalId,
};
