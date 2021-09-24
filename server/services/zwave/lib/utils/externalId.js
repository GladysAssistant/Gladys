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
  const nodeId = array[2];
  const comclass = array[4];
  const endpoint = array[6];
  const property = array[8];
  return {
    nodeId,
    comclass,
    endpoint,
    property,
  };
}

module.exports = {
  getDeviceExternalId,
  getDeviceFeatureExternalId,
  getNodeInfoByExternalId,
};
