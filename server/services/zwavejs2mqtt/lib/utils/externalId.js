/**
 * @description Return name of device
 * @param {Object} node - The zwave node.
 * @returns {string} Return name.
 * @example
 * getDeviceName(node);
 */
function getDeviceName(node) {
  return `${node.name} - ${node.nodeId}${node.endpoint > 0 ? ` [${node.endpoint}]` : ''}`;
}

/**
 * @description Return external id of device
 * @param {Object} node - The zwave node.
 * @returns {string} Return external id.
 * @example
 * getDeviceExternalId(node);
 */
function getDeviceExternalId(node) {
  return `zwavejs2mqtt:node_id:${node.nodeId}${node.endpoint > 0 ? `_${node.endpoint}` : ''}`;
}

/**
 * @description Return name of device feature
 * @param {Object} property - The zwave property.
 * @returns {string} Return name.
 * @example
 * getDeviceFeatureName(feature);
 */
 function getDeviceFeatureName(property) {
  return `${property.label}${property.endpoint > 0 ? ` [${property.endpoint}]` : ''}`;
}

/**
 * @description Return external id of deviceFeature
 * @param {Object} property - The zwave property.
 * @returns {string} Return external id.
 * @example
 * getDeviceFeatureExternalId(property);
 */
function getDeviceFeatureExternalId(property) {
  return `zwavejs2mqtt:node_id:${property.nodeId}:comclass:${property.commandClass}:endpoint:${property.endpoint}:property:${property.property}`;
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
  getDeviceName,
  getDeviceExternalId,
  getDeviceFeatureName,
  getDeviceFeatureExternalId,
  getNodeInfoByExternalId,
};
