const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When a node is ready.
 * @param {Object} node - Informations about the node.
 * @example
 * zwave.on('node ready', this.nodeReady);
 */
function nodeReady(node) {
  logger.debug(`Zwave : Node Ready, nodeId = ${node.id}`);

  const nodeId = node.id;
  this.nodes[nodeId].manufacturer = node.manufacturer;
  this.nodes[nodeId].manufacturerid = node.manufacturerId;
  this.nodes[nodeId].product = node.product;
  this.nodes[nodeId].producttype = node.productType;
  this.nodes[nodeId].productid = node.productId;
  this.nodes[nodeId].type = node.noedType;
  this.nodes[nodeId].name = node.name;
  this.nodes[nodeId].loc = node.location;
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
