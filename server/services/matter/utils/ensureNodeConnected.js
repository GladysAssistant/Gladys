const logger = require('../../../utils/logger');
const { MATTER_NODE_CONNECTION_TIMEOUT_MS } = require('./constants');

/**
 * @description Format a node label for log messages.
 * @param {bigint|number|string|undefined} nodeId - The Matter node ID.
 * @returns {string} The formatted node label.
 * @example formatNodeLabel(12345n);
 */
function formatNodeLabel(nodeId) {
  if (nodeId !== undefined && nodeId !== null) {
    return `node ${nodeId}`;
  }
  return 'node';
}

/**
 * @description Ensure a Matter node is connected before reading attributes or subscribing.
 * @param {object} node - The Matter node.
 * @param {object} [options] - Connection options.
 * @param {number} [options.timeoutMs] - Connection timeout in milliseconds.
 * @param {bigint|number|string} [options.nodeId] - The Matter node ID for log messages.
 * @returns {Promise<boolean>} True when the node is connected, false otherwise.
 * @example const isConnected = await ensureNodeConnected(node, { nodeId });
 */
async function ensureNodeConnected(node, options = {}) {
  const { timeoutMs = MATTER_NODE_CONNECTION_TIMEOUT_MS, nodeId } = options;
  const nodeLabel = formatNodeLabel(nodeId);

  if (node.isConnected) {
    logger.debug(`Matter: ${nodeLabel} is already connected`);
    return true;
  }

  logger.info(`Matter: Connecting ${nodeLabel}...`);

  let timeoutId;
  try {
    node.connect();
    await Promise.race([
      node.events.initialized,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Connection timeout')), timeoutMs);
      }),
    ]);
    logger.info(`Matter: ${nodeLabel} connected.`);
    return true;
  } catch (error) {
    logger.warn(`Matter: Failed to connect ${nodeLabel}: ${error.message}`);
    return false;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

module.exports = {
  ensureNodeConnected,
  formatNodeLabel,
};
