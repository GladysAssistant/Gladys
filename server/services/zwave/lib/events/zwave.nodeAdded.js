const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When a node is added.
 * @param {number} nodeId - The ID of the node.
 * @example
 * zwave.on('node added', this.nodeAdded);
 */
function nodeAdded(nodeId) {
  logger.debug(`Zwave : Node Added, nodeId = ${nodeId}`);
  this.nodes[nodeId] = {
    manufacturer: '',
    manufacturerid: '',
    product: '',
    producttype: '',
    productid: '',
    type: '',
    name: '',
    loc: '',
    classes: {},
    ready: false,
  };
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_ADDED,
    payload: nodeId,
  });
}

module.exports = {
  nodeAdded,
};
