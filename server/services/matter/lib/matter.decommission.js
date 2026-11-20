const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { getNodeExternalIdPrefix, getGladysDevicesOfNode } = require('../utils/getGladysDevicesOfNode');

/**
 * @description Decommission a node: the node is asked to leave the fabric, and when it can not be
 * reached it is removed from the controller only (the appliance then has to be factory reset).
 * The Gladys devices created from this node can be deleted in the same gesture.
 * @param {bigint} nodeId - The node ID.
 * @param {object} [options] - Options.
 * @param {Array<string>} [options.gladysDeviceSelectors] - The Gladys devices of this node the user
 * confirmed to delete. Only the ones which are really devices of this node are deleted.
 * @returns {Promise<object>} Whether the removal was forced, and the Gladys devices deleted / kept.
 * @example await matter.decommission(nodeId, { gladysDeviceSelectors: ['kitchen-plug'] });
 */
async function decommission(nodeId, { gladysDeviceSelectors = [] } = {}) {
  if (!this.commissioningController) {
    throw new ServiceNotConfiguredError('Matter is not started');
  }
  const node = this.nodesMap.get(nodeId);
  // the devices shown to the user when they confirmed: a device of this node created since then
  // (another tab, another admin) is not deleted without having been listed
  const confirmedSelectors = new Set(gladysDeviceSelectors);
  const nodeDevices = getGladysDevicesOfNode(this.gladys.stateManager, nodeId).filter((device) =>
    confirmedSelectors.has(device.selector),
  );
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
  const externalIdPrefix = getNodeExternalIdPrefix(nodeId);
  this.devices = this.devices.filter((device) => !device.external_id.startsWith(externalIdPrefix));

  const deletedDevices = [];
  const failedDevices = [];
  await Promise.each(nodeDevices, async (device) => {
    // node.decommission() can be long: in the meantime the device may have been deleted, or taken
    // over by a re-paired node from the Devices tab. It is then not a device of this node anymore.
    const currentDevice = this.gladys.stateManager.get('device', device.selector);
    if (currentDevice === null || !currentDevice.external_id.startsWith(externalIdPrefix)) {
      logger.info(`Matter: Device ${device.selector} is no longer a device of node ${nodeId}, it is kept`);
      return;
    }
    try {
      await this.gladys.device.destroy(device.selector);
      deletedDevices.push(device);
    } catch (e) {
      // the node is already gone: one device that can not be deleted (too many states,
      // the purge is then running) must not hide the others
      logger.warn(`Matter: Failed to delete device ${device.selector} of node ${nodeId}: ${e}`);
      failedDevices.push(device);
    }
  });

  return {
    forced,
    deleted_devices: deletedDevices,
    failed_devices: failedDevices,
  };
}

module.exports = { decommission };
