const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { valueAdded } = require('./valueAdded');

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
  node.nodeId = nodeId;
  node.product = `${zwaveNode.manufacturerId}-${zwaveNode.productType}-${zwaveNode.productId}`;
  node.type = zwaveNode.nodeType;
  node.deviceDatabaseUrl = zwaveNode.deviceDatabaseUrl;
  node.firmwareVersion = zwaveNode.firmwareVersion;
  node.name = `${zwaveNode.name ||
    zwaveNode.label ||
    `${zwaveNode.manufacturerId}-${zwaveNode.productType}-${zwaveNode.productId}`}`;
  node.location = zwaveNode.location;
  node.status = zwaveNode.status;
  node.ready = zwaveNode.ready;
  node.classes = {};

  if (zwaveNode.getDefinedValueIDs) {
    zwaveNode.getDefinedValueIDs().forEach((data) => {
      valueAdded.bind(this)(zwaveNode, data);
    });
  }

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
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.NODE_READY,
    payload: {
      nodeId,
      name: node.name,
      status: node.status,
    },
  });
}

module.exports = {
  nodeReady,
};
