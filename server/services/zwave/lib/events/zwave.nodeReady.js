const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When a node is ready.
 * @param {number} nodeId - The ID of the node.
 * @param {Object} nodeInfo - Informations about the node.
 * @example
 * zwave.on('node ready', this.nodeReady);
 */
function nodeReady(nodeId, nodeInfo) {
  logger.debug(`Zwave : Node Ready, nodeId = ${nodeId}`);
  this.nodes[nodeId].manufacturer = nodeInfo.manufacturer;
  this.nodes[nodeId].manufacturerid = nodeInfo.manufacturerid;
  this.nodes[nodeId].product = nodeInfo.product;
  this.nodes[nodeId].producttype = nodeInfo.producttype;
  this.nodes[nodeId].productid = nodeInfo.productid;
  this.nodes[nodeId].type = nodeInfo.type;
  this.nodes[nodeId].name = nodeInfo.name;
  this.nodes[nodeId].loc = nodeInfo.loc;
  this.nodes[nodeId].ready = true;

  // enable poll if needed
  const comclasses = Object.keys(this.nodes[nodeId].classes);
  comclasses.forEach((comclass) => {
    const values = this.nodes[nodeId].classes[comclass];
    // enable poll
    switch (values.class_id) {
      case 0x25: // COMMAND_CLASS_SWITCH_BINARY
      case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
        this.zwave.enablePoll(nodeId, comclass);
        break;
      default:
        break;
    }
  });
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_READY,
    payload: this.nodes[nodeId],
  });
}

module.exports = {
  nodeReady,
};
