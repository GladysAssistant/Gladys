const logger = require('../../../utils/logger');
const { MATTER_NODE_CONNECTION_TIMEOUT_MS } = require('./constants');

/**
 * @description Ensure a Matter node is connected before reading attributes or subscribing.
 * @param {object} node - The Matter node.
 * @param {number} [timeoutMs] - Connection timeout in milliseconds.
 * @returns {Promise<boolean>} True when the node is connected, false otherwise.
 * @example const isConnected = await ensureNodeConnected(node);
 */
async function ensureNodeConnected(node, timeoutMs = MATTER_NODE_CONNECTION_TIMEOUT_MS) {
  if (node.isConnected) {
    return true;
  }

  logger.debug('Matter: Node is not connected, connecting...');
  node.connect();

  let timeoutId;
  try {
    await Promise.race([
      node.events.initialized,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Connection timeout')), timeoutMs);
      }),
    ]);
    logger.info('Matter: Node connected.');
    return true;
  } catch (error) {
    logger.warn(`Matter: Failed to connect node: ${error.message}`);
    return false;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

module.exports = {
  ensureNodeConnected,
};
