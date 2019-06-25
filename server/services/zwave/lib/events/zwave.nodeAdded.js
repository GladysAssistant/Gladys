const logger = require('../../../../utils/logger');

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
}

module.exports = {
  nodeAdded,
};
