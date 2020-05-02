/**
 * @description Parse the external id and return outlet ID.
 * @param {string} externalId - External id of the device.
 * @returns {Object} Return the outlet ID.
 * @example
 * parseExternalId('w215:xxx.xxx.xxx.xxx');
 */
function parseExternalId(externalId) {
  const parsedExternalId = externalId.split(':');
  const outletIpAdress = parsedExternalId[1];
  return {
    outletIpAdress,
  };
}

module.exports = {
  parseExternalId,
};
