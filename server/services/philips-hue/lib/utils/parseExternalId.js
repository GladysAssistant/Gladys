/**
 * @description Parse the external id and return the lamp ID.
 * @param {string} externalId - External id of the device.
 * @returns {object} Return the lamp ID and bridge serial number.
 * @example
 * parseExternalId('philips-hue:1');
 */
function parseExternalId(externalId) {
  const parsedExternalId = externalId.split(':');
  const bridgeSerialNumber = parsedExternalId[1];
  const lightId = parseInt(parsedExternalId[2], 10);
  return {
    bridgeSerialNumber,
    lightId,
  };
}

module.exports = {
  parseExternalId,
};
