const logger = require('../../../../utils/logger');

/**
 * @description When a node is ready.
 * @param {object} zwaveNode - Informations about the node.
 * @example
 * zwave.on('node ready', this.nodeReady);
 */
function nodeReady(zwaveNode) {
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Node Ready, nodeId = ${nodeId}`);

  const node = this.nodes[nodeId];
  node.nodeId = nodeId;
  node.product = zwaveNode.deviceId;
  node.firmwareVersion = zwaveNode.firmwareVersion;
  node.name = `${zwaveNode.name || zwaveNode.productLabel || `${zwaveNode.product}`}`;
  node.loc = zwaveNode.loc;
  node.status = zwaveNode.status;
  node.ready = zwaveNode.ready;
  node.classes = {};
}

module.exports = {
  nodeReady,
};
