const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Refreshes all non-static sensor and actuator values from this node.
 * @param {number} nodeId - The NodeId.
 * @example
 * zwave.refreshValues(1);
 */
function refreshValues(nodeId) {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  logger.info(`Zwave : Refresh all params of node ${nodeId}`);
  this.driver.controller.nodes.get(nodeId).refreshValues();
}

module.exports = {
  refreshValues,
};
