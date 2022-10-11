const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Request all params of a node.
 * @param {number} nodeId - The NodeId.
 * @example
 * zwave.refreshNodeParams(1);
 */
function refreshNodeParams(nodeId) {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  logger.debug(`Zwave : Request all params of nodeId = ${nodeId}`);
  this.zwave.requestAllConfigParams(nodeId);
}

module.exports = {
  refreshNodeParams,
};
