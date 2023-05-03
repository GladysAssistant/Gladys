/**
 * @description Return name of device
 * @param {Object} node - The zwave value.
 * @returns {string} Return name.
 * @example
 * getDeviceName(node);
 */
function getDeviceName(node) {
  return `${node.name} (${node.place})`;
}

/**
 * @description Return external id of device
 * @param {Object} node - The zwave value.
 * @returns {string} Return external id.
 * @example
 * getDeviceExternalId(node);
 */
function getDeviceExternalId(node) {
  const deviceURL = node.URL;
  return `overkiz:deviceURL:${deviceURL}`;
}

/**
 * @description Return external id of deviceFeature
 * @param {Object} node - The node feature.
 * @param {Object} state - The node state feature.
 * @returns {string} Return external id.
 * @example
 * getDeviceFeatureExternalId(node);
 */
function getDeviceFeatureExternalId(node, state) {
  const deviceURL = node.URL;
  return `overkiz:deviceURL:${deviceURL}:state:${state}`;
}

/**
 * @description Return node info of device.
 * @param {Object} device - The device.
 * @returns {Object} Return all informations.
 * @example
 * getNodeInfoByExternalId({external_id: ''});
 */
function getNodeInfoByExternalId(device) {
  const array = device.external_id.split(':');
  return {
    deviceURL: `${array[2]}:${array[3]}`,
  };
}

/**
 * @description Return node info of devicefeature.
 * @param {Object} deviceFeature - The devicefeature.
 * @returns {Object} Return all informations.
 * @example
 * getNodeStateInfoByExternalId({external_id: ''});
 */
function getNodeStateInfoByExternalId(deviceFeature) {
  const array = deviceFeature.external_id.split(':');
  return {
    deviceURL: `${array[2]}:${array[3]}`,
    state: `${array[5]}:${array[6]}`,
  };
}

module.exports = {
  getDeviceName,
  getDeviceExternalId,
  getDeviceFeatureExternalId,
  getNodeInfoByExternalId,
  getNodeStateInfoByExternalId,
};
