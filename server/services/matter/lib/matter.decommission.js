/**
 * @description Decommission a node.
 * @param {bigint} nodeId - The node ID.
 * @example matter.decommission(nodeId);
 */
async function decommission(nodeId) {
  const node = this.nodesMap.get(nodeId);
  await node.decommission();
  this.nodesMap.delete(nodeId);
  this.devices = this.devices.filter((device) => !device.external_id.startsWith(`matter:${nodeId.toString()}:`));
}

module.exports = { decommission };
