const logger = require('../../../../utils/logger');
const { NODE_STATES } = require('../constants');

/**
 * @description When a note interview is started.
 * @param {Object} zwaveNode - Zwave Node.
 * @example
 * zwave.on('interview started', this.nodeInterviewStarted);
 */
function nodeInterviewStarted(zwaveNode) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Interview Started: nodeId = ${nodeId}`);
  node.state = NODE_STATES.INTERVIEW_STARTED;
}

/**
 * @description When a note interview is completed.
 * @param {Object} zwaveNode - Zwave Node.
 * @param {string} stageName - Stage Name.
 * @example
 * zwave.on('interview stage completed', this.nodeInterviewStageCompleted);
 */
function nodeInterviewStageCompleted(zwaveNode, stageName) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Interview Completed: nodeId = ${nodeId}, stage = ${stageName}`);
  node.state = NODE_STATES.INTERVIEW_STAGE_COMPLETED;
}

/**
 * @description When a note interview is completed.
 * @param {Object} zwaveNode - Zwave Node.
 * @example
 * zwave.on('interview completed', this.nodeInterviewCompleted);
 */
function nodeInterviewCompleted(zwaveNode) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Zwave : Interview Completed, nodeId = ${nodeId}`);
  node.state = NODE_STATES.INTERVIEW_COMPLETED;
}

/**
 * @description When a note interview failed.
 * @param {Object} zwaveNode - Zwave Node.
 * @param {Object} args - Zwave NodeInterviewFailedEventArgs.
 * @example
 * zwave.on('interview failed', this.nodeInterviewFailed);
 */
function nodeInterviewFailed(zwaveNode, args) {
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  logger.debug(`Zwave : Interview Failed, nodeId = ${nodeId}`);
  node.state = NODE_STATES.INTERVIEW_FAILED;
}

module.exports = {
  nodeInterviewStarted,
  nodeInterviewStageCompleted,
  nodeInterviewCompleted,
  nodeInterviewFailed,
};
