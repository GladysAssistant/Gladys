const logger = require('../../../../utils/logger');

/**
 * @description When a node event is received.
 * @param {number} nodeId - The ID of the node.
 * @param {Object} data - The event.
 * @example
 * zwave.on('node event', this.nodeEvent);
 */
function nodeEvent(nodeId, data) {
  logger.debug(`Zwave : Node Event, nodeId = ${nodeId}, data = ${data}`);
}

module.exports = {
  nodeEvent,
};
