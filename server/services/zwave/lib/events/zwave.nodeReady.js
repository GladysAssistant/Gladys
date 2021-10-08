const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { valueAdded } = require('./zwave.valueAdded');

/**
 * @description When a node is ready.
 * @param {Object} zwaveNode - Informations about the node.
 * @example
 * zwave.on('node ready', this.nodeReady);
 */
function nodeReady(zwaveNode) {
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Node Ready, nodeId = ${nodeId}`);

  const node = this.nodes[nodeId];
  node.status = zwaveNode.status;
  node.ready = zwaveNode.ready;
  node.classes = {};

  zwaveNode.getDefinedValueIDs().forEach((data) => {
    valueAdded.bind(this)(zwaveNode, data);
  });

  // enable poll if needed
  /* const comclasses = Object.keys(this.nodes[nodeId].classes);
  comclasses.forEach((comclass) => {
    const values = this.nodes[nodeId].classes[comclass];
    // enable poll
    switch (values.commandClass) {
      case 0x25: // COMMAND_CLASS_SWITCH_BINARY
      case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
        this.zwave.enablePoll(nodeId, comclass);
        break;
      default:
        break;
    }
  }); */
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_READY,
    payload: this.nodes[nodeId],
  });
}

module.exports = {
  nodeReady,
};
