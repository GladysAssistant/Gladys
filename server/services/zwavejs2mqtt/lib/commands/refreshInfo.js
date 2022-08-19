const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Resets (almost) all information about this node and forces a fresh interview.
 * @param {number} nodeId - The NodeId.
 * @example
 * zwave.refreshInfo(1);
 */
function refreshInfo(nodeId) {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  logger.info(`Zwave : Refresh information of node ${nodeId}`);
  this.driver.controller.nodes.get(nodeId).refreshInfo();
}

module.exports = {
  refreshInfo,
};
