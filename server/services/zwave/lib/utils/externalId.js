/**
 * @description Return external id of deviceFeature
 * @param {Object} value - The zwave value.
 * @returns {string} Return external id.
 * @example
 * getDeviceFeatureExternalId(value);
 */
function getDeviceFeatureExternalId(value) {
  return `zwave:node_id:${value.node_id}:comclass:${value.class_id}:index:${value.index}:instance:${value.instance}`;
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
  const index = array[6];
  const instance = array[8];
  return {
    nodeId,
    comclass,
    index,
    instance,
  };
}

module.exports = {
  getDeviceFeatureExternalId,
  getNodeInfoByExternalId,
};
