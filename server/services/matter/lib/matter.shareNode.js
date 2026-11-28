const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
const { MATTER_SHARE_WINDOW_SECONDS } = require('../utils/constants');
const { ensureNodeConnected } = require('../utils/ensureNodeConnected');

/**
 * @description Shares a node with another ecosystem (Apple Home, Google Home, Alexa…): opens a
 * commissioning window on the node and gives the codes the other app asks for. Gladys keeps
 * controlling the node.
 * @param {bigint} nodeId - The node ID.
 * @returns {Promise<object>} The manual and QR pairing codes, when they expire and the window duration.
 * @example
 * const { manual_pairing_code: code } = await matterHandler.shareNode(1234n);
 */
async function shareNode(nodeId) {
  const node = this.nodesMap.get(nodeId);
  if (!node) {
    throw new NotFoundError(`Matter node ${nodeId} not found`);
  }
  const isConnected = await ensureNodeConnected(node, { nodeId });
  if (!isConnected) {
    throw new Error(`Matter: Node ${nodeId} is unreachable, it can not be shared`);
  }
  const { manualPairingCode, qrPairingCode } = await node.openEnhancedCommissioningWindow(MATTER_SHARE_WINDOW_SECONDS);
  logger.info(`Matter: Commissioning window opened on node ${nodeId} for ${MATTER_SHARE_WINDOW_SECONDS} seconds`);
  return {
    manual_pairing_code: manualPairingCode,
    qr_pairing_code: qrPairingCode,
    expires_at: new Date(Date.now() + MATTER_SHARE_WINDOW_SECONDS * 1000).toISOString(),
    duration_seconds: MATTER_SHARE_WINDOW_SECONDS,
  };
}

module.exports = {
  shareNode,
};
