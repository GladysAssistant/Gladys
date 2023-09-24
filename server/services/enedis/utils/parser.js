/**
 * @description Return the usage point id of an enedis device.
 * @param {string} externalId - External ID of the device.
 * @returns {string} Returns the usage point id.
 * @example
 * const usagePointId = getUsagePointIdFromExternalId('enedis:1234232323');
 */
function getUsagePointIdFromExternalId(externalId) {
  return externalId.split(':')[1];
}

module.exports = {
  getUsagePointIdFromExternalId,
};
