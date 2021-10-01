const logger = require('../../../../utils/logger');

/**
 * @description When a value is removed.
 * @param {Object} zwaveNode - Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function nodeInterviewStarted(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Zwave : Interview Started, nodeId = ${nodeId}`);
  node.status = 'nodeInterviewStarted';
}

/**
 * @description When a value is dead.
 * @param {Object} zwaveNode - Zwave Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function nodeInterviewStageCompleted(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Zwave : Interview Completed, nodeId = ${nodeId}`);
  node.status = 'nodeInterviewStageCompleted';
}

/**
 * @description When a value go to sleep.
 * @param {Object} zwaveNode - Zwave Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function nodeInterviewCompleted(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Zwave : Interview Completed, nodeId = ${nodeId}`);
  node.status = 'nodeInterviewCompleted';
}

/**
 * @description When a value wakes up.
 * @param {Object} zwaveNode - Zwave Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function nodeInterviewFailed(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Zwave : Interview Failed, nodeId = ${nodeId}`);
  node.status = 'nodeInterviewFailed';
}

module.exports = {
  nodeInterviewStarted,
  nodeInterviewStageCompleted,
  nodeInterviewCompleted,
  nodeInterviewFailed,
};
