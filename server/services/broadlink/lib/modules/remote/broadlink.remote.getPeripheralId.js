const { PARAMS } = require('../../utils/broadlink.constants');

/**
 * @description Extract Broadlink peripheral ID from device.
 * @param {Object} device - Gladys device.
 * @returns {string} The Broadlink peripheral identifier.
 * @example
 * remoteHandler.getPeripheralId(device);
 */
function getPeripheralId(device) {
  const { external_id: externalId, id, params = [] } = device;
  const [, peripheral] = externalId.split(':');

  if (id !== peripheral) {
    return null;
  }

  const peripheralParam = params.find((p) => p.name === PARAMS.PERIPHERAL);
  return (peripheralParam || {}).value;
}

module.exports = {
  getPeripheralId,
};
