const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Getting neighbors of all nodes.
 * @returns {Promise<Array>} Return array of nodes and their neighbors.
 * @example
 * zwave.getNodeNeighbors();
 */
async function getNodeNeighbors() {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  logger.debug(`Zwave : Getting node neighbors...`);
  const nodeIds = Object.keys(this.nodes);
  const nodes = await Promise.all(
    nodeIds.map(async (nodeId) => {
      const neighbors = await this.driver.controller.getNodeNeighbors(nodeId);
      return {
        id: nodeId,
        manufacturer: this.nodes[nodeId].manufacturer,
        product: this.nodes[nodeId].product,
        neighbors,
      };
    }),
  );
  return nodes;
}

module.exports = {
  getNodeNeighbors,
};
