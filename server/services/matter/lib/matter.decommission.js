const logger = require('../../../utils/logger');

/**
 * @description Decommission a node.
 * @param {bigint} nodeId - The node ID.
 * @example matter.decommission(nodeId);
 */
async function decommission(nodeId) {
  const node = this.nodesMap.get(nodeId);
  try {
    await node.decommission();
  } catch (e) {
    logger.warn(`Matter: Failed to decommission node ${nodeId}: ${e}`);
    await this.commissioningController.removeNode(BigInt(nodeId), false);
  }

  this.nodesMap.delete(nodeId);
  this.devices = this.devices.filter((device) => !device.external_id.startsWith(`matter:${nodeId.toString()}:`));
}

module.exports = { decommission };
