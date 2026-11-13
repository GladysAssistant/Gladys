/**
 * @description The prefix shared by the external_id of all the devices of a Matter node
 * (matter:<nodeId>:<devicePath>).
 * @param {bigint|string} nodeId - The Matter node ID.
 * @returns {string} The external_id prefix.
 * @example getNodeExternalIdPrefix(1234n); // 'matter:1234:'
 */
function getNodeExternalIdPrefix(nodeId) {
  return `matter:${nodeId.toString()}:`;
}

/**
 * @description List the Gladys devices created from a Matter node. They are read from the
 * in-memory state (kept up to date by device.add / device.destroy): no database query, and only the
 * fields needed to show and delete them.
 * @param {object} stateManager - The Gladys state manager.
 * @param {bigint|string} nodeId - The Matter node ID.
 * @returns {Array<object>} The devices of the node, as { name, selector }.
 * @example const devices = getGladysDevicesOfNode(gladys.stateManager, 1234n);
 */
function getGladysDevicesOfNode(stateManager, nodeId) {
  const externalIdPrefix = getNodeExternalIdPrefix(nodeId);
  return stateManager
    .getAllKeys('deviceByExternalId')
    .filter((externalId) => externalId.startsWith(externalIdPrefix))
    .map((externalId) => stateManager.get('deviceByExternalId', externalId))
    .filter((device) => device !== null)
    .map((device) => ({ name: device.name, selector: device.selector }));
}

module.exports = { getNodeExternalIdPrefix, getGladysDevicesOfNode };
