const Promise = require('bluebird');

const logger = require('../../../utils/logger');

/**
 * @description Refresh the devices.
 * @example matter.refreshDevices();
 */
async function refreshDevices() {
  // Reset memory
  this.devices = [];
  const nodeDetails = this.commissioningController.getCommissionedNodesDetails();

  await Promise.each(nodeDetails, async (nodeDetail) => {
    try {
      await this.handleNode(nodeDetail);
    } catch (err) {
      // Log error but continue with other devices - one unreachable device shouldn't break the others
      logger.warn(`Matter: Error handling node ${nodeDetail.nodeId}: ${err.message}`);
    }
  });
}

module.exports = {
  refreshDevices,
};
