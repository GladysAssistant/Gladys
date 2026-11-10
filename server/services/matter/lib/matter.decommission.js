const Promise = require('bluebird');
const logger = require('../../../utils/logger');

/**
 * @description Decommission a node: the node is asked to leave the fabric, and when it can not be
 * reached it is removed from the controller only (the appliance then has to be factory reset).
 * The Gladys devices created from this node can be deleted in the same gesture.
 * @param {bigint} nodeId - The node ID.
 * @param {object} [options] - Options.
 * @param {boolean} [options.deleteGladysDevices] - Also delete the Gladys devices of this node.
 * @returns {Promise<object>} Whether the removal was forced, and the Gladys devices deleted / kept.
 * @example await matter.decommission(nodeId, { deleteGladysDevices: true });
 */
async function decommission(nodeId, { deleteGladysDevices = false } = {}) {
  const node = this.nodesMap.get(nodeId);
  const externalIdPrefix = `matter:${nodeId.toString()}:`;
  // resolved before the node leaves the fabric: a lookup failure must leave everything as it was
  const nodeDevices = deleteGladysDevices
    ? (await this.gladys.device.get({ service: 'matter' })).filter((device) =>
        device.external_id.startsWith(externalIdPrefix),
      )
    : [];
  let forced = false;
  try {
    if (!node) {
      throw new Error('node is not loaded');
    }
    await node.decommission();
  } catch (e) {
    logger.warn(`Matter: Failed to decommission node ${nodeId}: ${e}, removing it from the controller`);
    // if this fails too, the error goes up to the caller and nothing is cleaned
    await this.commissioningController.removeNode(BigInt(nodeId), false);
    forced = true;
  }

  this.nodesMap.delete(nodeId);
  this.devices = this.devices.filter((device) => !device.external_id.startsWith(externalIdPrefix));

  const deletedDevices = [];
  const failedDevices = [];
  await Promise.each(nodeDevices, async (device) => {
    try {
      await this.gladys.device.destroy(device.selector);
      deletedDevices.push(device.name);
    } catch (e) {
      // the node is already gone: one device that can not be deleted (too many states,
      // the purge is then running) must not hide the others
      logger.warn(`Matter: Failed to delete device ${device.selector} of node ${nodeId}: ${e}`);
      failedDevices.push(device.name);
    }
  });

  return {
    forced,
    deleted_devices: deletedDevices,
    failed_devices: failedDevices,
  };
}

module.exports = { decommission };
