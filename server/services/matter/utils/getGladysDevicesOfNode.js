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
  // read by id, not by external_id: when a device is replaced by a re-paired one (same id, new
  // external_id), device.add does not remove the former deviceByExternalId key, which keeps the
  // device as it was, under its former node. The id never changes and always holds the current device.
  return stateManager
    .getAllKeys('deviceById')
    .map((id) => stateManager.get('deviceById', id))
    .filter((device) => device !== null && device.external_id.startsWith(externalIdPrefix))
    .map((device) => ({ name: device.name, selector: device.selector }));
}

module.exports = { getNodeExternalIdPrefix, getGladysDevicesOfNode };
