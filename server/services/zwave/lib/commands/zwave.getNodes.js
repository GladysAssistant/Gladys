const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Return array of Nodes.
 * @returns {Array} Return list of nodes.
 * @example
 * const nodes = zwaveManager.getNodes();
 */
function getNodes() {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  const nodeIds = Object.keys(this.nodes);
  return nodeIds.map((nodeId) => Object.assign({}, { id: nodeId }, this.nodes[nodeId]));
}

module.exports = {
  getNodes,
};
