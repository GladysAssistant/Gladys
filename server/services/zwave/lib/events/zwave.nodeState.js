const logger = require('../../../../utils/logger');
const { NODE_STATES } = require('../constants');

/**
 * @description When a node is alive.
 * @param {Object} zwaveNode - ZWave Node.
 * @example
 * zwave.on('alive', this.nodeAlive);
 */
function nodeAlive(zwaveNode) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Node is alive, nodeId = ${nodeId}`);
  node.ready = true;
  node.state = NODE_STATES.ALIVE;
}

/**
 * @description When a node is dead.
 * @param {Object} zwaveNode - Zwave Node.
 * @example
 * zwave.on('dead', this.nodeDead);
 */
function nodeDead(zwaveNode) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Node is dead, nodeId = ${nodeId}`);
  node.ready = false;
  node.state = NODE_STATES.DEAD;
}

/**
 * @description When a value go to sleep.
 * @param {Object} zwaveNode - Zwave Node.
 * @example
 * zwave.on('sleep', this.nodeSleep);
 */
function nodeSleep(zwaveNode) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Node Sleep, nodeId = ${nodeId}`);
  node.state = NODE_STATES.SLEEP;
}

/**
 * @description When a value wakes up.
 * @param {Object} zwaveNode - Zwave Node.
 * @example
 * zwave.on('wake up', this.nodeWakeUp);
 */
function nodeWakeUp(zwaveNode) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Node WakeUp, nodeId = ${nodeId}`);
  node.state = NODE_STATES.WAKE_UP;
}

module.exports = {
  nodeAlive,
  nodeDead,
  nodeSleep,
  nodeWakeUp,
};
