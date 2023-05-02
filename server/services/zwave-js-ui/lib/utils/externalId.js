const { COMMAND_CLASSES } = require('../constants');

/**
 * @description Return name of device.
 * @param {object} node - The zwave node.
 * @returns {string} Return name.
 * @example
 * getDeviceName(node);
 */
function getDeviceName(node) {
  return `${node.name} - ${node.nodeId}${node.endpoint > 0 ? ` [${node.endpoint}]` : ''}`;
}

/**
 * @description Return external id of device.
 * @param {object} node - The zwave node.
 * @returns {string} Return external id.
 * @example
 * getDeviceExternalId(node);
 */
function getDeviceExternalId(node) {
  return `zwave-js-ui:node_id:${node.nodeId}${node.endpoint > 0 ? `_${node.endpoint}` : ''}`;
}

/**
 * @description Return name of device feature.
 * @param {object} property - The zwave property.
 * @returns {string} Return name.
 * @example
 * getDeviceFeatureName(feature);
 */
function getDeviceFeatureName(property) {
  return `${property.prefLabel ? property.prefLabel : property.label}${
    property.endpoint > 0 ? ` [${property.endpoint}]` : ''
  }`;
}

/**
 * @description Return external id of deviceFeature.
 * @param {object} property - The zwave property.
 * @returns {string} Return external id.
 * @example
 * getDeviceFeatureExternalId(property);
 */
function getDeviceFeatureExternalId(property) {
  if (property.commandClass === COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE) {
    property.endpoint = Number(property.property.split('-')[1]);
  }
  return `zwave-js-ui:node_id:${property.nodeId}:comclass:${property.commandClass}:endpoint:${property.endpoint}:property:${property.property}`;
}

/**
 * @description Return node info of devicefeature.
 * @param {object} externalId - The externalId.
 * @returns {object} Return all informations.
 * @example
 * getNodeInfoByExternalId(externalId);
 */
function getNodeInfoByExternalId(externalId) {
  const array = externalId.split(':');
  const nodeId = parseInt(array[2], 10);
  const commandClass = parseInt(array[4], 10);
  const endpoint = parseInt(array[6], 10);
  const property = array[8].split('-');
  return {
    nodeId,
    commandClass,
    endpoint,
    property: property[0],
    propertyKey: property.length > 1 ? property[1] : undefined,
  };
}

module.exports = {
  getDeviceName,
  getDeviceExternalId,
  getDeviceFeatureName,
  getDeviceFeatureExternalId,
  getNodeInfoByExternalId,
};
