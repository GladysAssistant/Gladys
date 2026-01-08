const Promise = require('bluebird');

/**
 * @description Refresh the devices.
 * @example matter.refreshDevices();
 */
async function refreshDevices() {
  // Reset memory
  this.devices = [];
  const nodeDetails = this.commissioningController.getCommissionedNodesDetails();

  await Promise.each(nodeDetails, async (nodeDetail) => {
    await this.handleNode(nodeDetail);
  });
}

module.exports = {
  refreshDevices,
};
