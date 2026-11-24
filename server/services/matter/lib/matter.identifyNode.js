const Promise = require('bluebird');
// eslint-disable-next-line import/no-unresolved
const { Identify } = require('@matter/main/clusters');

const logger = require('../../../utils/logger');
const { BadParameters, NotFoundError } = require('../../../utils/coreErrors');
const { MATTER_IDENTIFY_DURATION_SECONDS } = require('../utils/constants');
const { ensureNodeConnected } = require('../utils/ensureNodeConnected');
const { collectEndpoints } = require('../utils/matterNodeInformation');

/**
 * @description Makes a node show itself (blink, beep), so that the user finds which appliance it is.
 * @param {bigint} nodeId - The node ID.
 * @param {object} [options] - Options.
 * @param {number} [options.seconds] - How long the node identifies itself.
 * @returns {Promise<object>} { identified_endpoints }, the number of endpoints asked.
 * @example
 * await matterHandler.identifyNode(1234n);
 */
async function identifyNode(nodeId, { seconds = MATTER_IDENTIFY_DURATION_SECONDS } = {}) {
  const node = this.nodesMap.get(nodeId);
  if (!node) {
    throw new NotFoundError(`Matter node ${nodeId} not found`);
  }
  const clusterClients = collectEndpoints(node.getDevices())
    .map((endpoint) => endpoint.getClusterClientById(Identify.Complete.id))
    .filter(Boolean);
  if (clusterClients.length === 0) {
    throw new BadParameters(`Matter node ${nodeId} can not identify itself`);
  }
  const isConnected = await ensureNodeConnected(node, { nodeId });
  if (!isConnected) {
    throw new Error(`Matter: Node ${nodeId} is unreachable, it can not identify itself`);
  }
  logger.info(`Matter: Node ${nodeId} identifies itself for ${seconds} seconds`);
  await Promise.map(clusterClients, (clusterClient) => clusterClient.identify({ identifyTime: seconds }));
  return { identified_endpoints: clusterClients.length };
}

module.exports = {
  identifyNode,
};
