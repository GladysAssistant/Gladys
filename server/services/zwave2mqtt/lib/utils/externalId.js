const { BadParameters } = require('../../../../utils/coreErrors');

/**
 * @description Return external id of deviceFeature
 * @param {Object} value - The zwave value.
 * @returns {string} Return external id.
 * @example
 * getDeviceExternalId(value);
 */
function getDeviceExternalId(value) {
  return `zwave2mqtt:nodeID_${value.node_id}`;
}

/**
 * @description Return external id of deviceFeature
 * @param {Object} value - The zwave value.
 * @returns {string} Return external id.
 * @example
 * getDeviceFeatureExternalId(value);
 */
function getDeviceFeatureExternalId(value) {
  return `zwave2mqtt:nodeID_${value.node_id}/${value.class_id}/${value.instance}/${value.propertyKey}`;
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
  const prefix = array[0];
  if (prefix !== 'zwave2mqtt') {
    throw new BadParameters(
      `Zwave2mqtt device external_id is invalid: "${externalId}" should starts with "zwave2mqtt:"`,
    );
  }
  const array2 = array[1].split('/');
  const nodeId = array2[0];
  const classId = array2[1];
  const instance = array2[2];
  const propertyKey = array2[3];
  return {
    nodeId,
    classId,
    instance,
    propertyKey,
  };
}

module.exports = {
  getDeviceExternalId,
  getDeviceFeatureExternalId,
  getNodeInfoByExternalId,
};
