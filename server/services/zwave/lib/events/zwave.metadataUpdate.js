const logger = require('../../../../utils/logger');

/**
 * @description When a node metadata is updated.
 * @param {Object} zwaveNode - The node updated.
 * @example
 * zwave.on('metadata update', this.metadataUpdate);
 */
function metadataUpdate(zwaveNode) {
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Node Metadata Updated, nodeId = ${nodeId}`);
}

module.exports = {
    metadataUpdate,
  };
  