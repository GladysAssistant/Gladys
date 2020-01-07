const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When a node is removed.
 * @param {number} nodeId - The ID of the node.
 * @example
 * zwave.on('node removed', this.nodeRemoved);
 */
function nodeRemoved(nodeId) {
  logger.debug(`Zwave : Node removed, nodeId = ${nodeId}`);
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_REMOVED,
    payload: nodeId,
  });
  delete this.nodes[nodeId];
}

module.exports = {
  nodeRemoved,
};
