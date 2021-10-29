const logger = require('../../../../utils/logger');

/**
 * @description Statistics about a node
 * @param {Object} zwaveNode - ZWave Node.
 * @param {Object} statistics - Zwave node statistics.
 * @example
 * zwave.on('statistics updated', this.statistics);
 */
function statisticsUpdated(zwaveNode, statistics) {
  const { commandsTX, commandsRX, commandsDroppedRX, commandsDroppedTX, timeoutResponse } = statistics;
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(
    `Statistics: nodeId = ${nodeId}, commandsTX = ${commandsTX}, commandsRX = ${commandsRX}, commandsDroppedRX = ${commandsDroppedRX}, commandsDroppedTX = ${commandsDroppedTX}, timeoutResponse = ${timeoutResponse}`,
  );
  node.statistics = {
    lastUpdate: new Date().getTime(),
    commandsTX,
    commandsRX,
    commandsDroppedRX,
    commandsDroppedTX,
    timeoutResponse,
  };
}

module.exports = {
  statisticsUpdated,
};
