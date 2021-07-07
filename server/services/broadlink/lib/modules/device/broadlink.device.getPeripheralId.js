/**
 * @description Extract Broadlink peripheral ID from device.
 * @param {Object} device - Gladys device.
 * @returns {string} The Broadlink peripheral identifier.
 * @example
 * deviceHandler.getPeripheralId(device);
 */
function getPeripheralId(device) {
  const { external_id: externalId, id } = device;
  const [, peripheral] = externalId.split(':');

  if (id === peripheral) {
    return null;
  }

  return peripheral;
}

module.exports = {
  getPeripheralId,
};
