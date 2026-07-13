const Promise = require('bluebird');

const logger = require('../../../utils/logger');
const { MATTER_NODE_REFRESH_CONCURRENCY } = require('../utils/constants');

/**
 * @description Refresh the devices.
 * @example matter.refreshDevices();
 */
async function refreshDevices() {
  // Reset memory
  this.devices = [];
  const nodeDetails = this.commissioningController.getCommissionedNodesDetails();

  logger.info(`Matter: Refreshing ${nodeDetails.length} commissioned node(s)...`);

  await Promise.map(
    nodeDetails,
    async (nodeDetail) => {
      try {
        await this.handleNode(nodeDetail);
      } catch (err) {
        // Log error but continue with other devices - one unreachable device shouldn't break the others
        logger.warn(`Matter: Error handling node ${nodeDetail.nodeId}: ${err.message}`);
      }
    },
    { concurrency: MATTER_NODE_REFRESH_CONCURRENCY },
  );

  logger.info(`Matter: Refresh complete, ${this.devices.length} device(s) with features discovered`);
}

module.exports = {
  refreshDevices,
};
