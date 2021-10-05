const logger = require('../../../../utils/logger');

/**
 * @description When a value is removed.
 * @param {Object} zwaveNode - Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function nodeAlive(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Zwave : Node is alive, nodeId = ${nodeId}`);
  node.ready = true;
}

/**
 * @description When a value is dead.
 * @param {Object} zwaveNode - Zwave Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function nodeDead(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Zwave : Node is dead, nodeId = ${nodeId}`);
  node.ready = false;
}

/**
 * @description When a value go to sleep.
 * @param {Object} zwaveNode - Zwave Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function nodeSleep(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Node Sleep, nodeId = ${nodeId}`);
}

/**
 * @description When a value wakes up.
 * @param {Object} zwaveNode - Zwave Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function nodeWakeUp(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Node WakeUp, nodeId = ${nodeId}`);
}

module.exports = {
  nodeAlive,
  nodeDead,
  nodeSleep,
  nodeWakeUp,
};
