const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When a node is removed.
 * @param {Object} node - The node removed.
 * @example
 * zwave.on('node removed', this.nodeRemoved);
 */
function nodeRemoved(node) {
  logger.debug(`Zwave : Node removed, nodeId = ${node.id}`);

  const nodeId = node.id;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_REMOVED,
    payload: nodeId,
  });
  delete this.nodes[nodeId];
}

module.exports = {
  nodeRemoved,
};
