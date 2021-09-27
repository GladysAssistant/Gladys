/**
 * @description Return external id of device
 * @param {Object} value - The zwave value.
 * @returns {string} Return external id.
 * @example
 * getDeviceExternalId(value);
 */
function getDeviceExternalId(value) {
  return `zwave:node_id:${value.nodeId}`;
}

/**
 * @description Return external id of deviceFeature
 * @param {Object} value - The zwave value.
 * @returns {string} Return external id.
 * @example
 * getDeviceFeatureExternalId(value);
 */
function getDeviceFeatureExternalId(value) {
  return `zwave:node_id:${value.nodeId}:comclass:${value.commandClass}:endpoint:${value.endpoint}:property:${value.property}`;
}

/**
 * @description Return node info of devicefeature.
 * @param {Object} externalId - The externalId.
 * @returns {Object} Return all informations.
 * @example
 * getNodeInfoByExternalId(externalId);
 */
function getNodeInfoByExternalId(externalId) {
  const array = externalId.split(':');
  const nodeId = parseInt(array[2], 10);
  const commandClass = parseInt(array[4], 10);
  const endpoint = parseInt(array[6], 10);
  const property = array[8];
  return {
    nodeId,
    commandClass,
    endpoint,
    property,
  };
}

module.exports = {
  getDeviceExternalId,
  getDeviceFeatureExternalId,
  getNodeInfoByExternalId,
};
