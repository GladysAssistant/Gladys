const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When a node is added.
 * @param {Object} zwaveNode - The node added.
 * @example
 * nodeAdded({ id:0, getAllEndpoints: () -> [], on: (event, callback) -> {} });
 */
function nodeAdded(zwaveNode) {
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Node Added, nodeId = ${nodeId}`);

  this.nodes[nodeId] = {
    nodeId,
    classes: {},
    ready: false,
    endpoints: zwaveNode.getAllEndpoints(),
  };

  zwaveNode
    .on('ready', this.nodeReady.bind(this))
    .on('interview started', this.nodeInterviewStarted.bind(this))
    .on('interview stage completed', this.nodeInterviewStageCompleted.bind(this))
    .on('interview completed', this.nodeInterviewCompleted.bind(this))
    .on('interview failed', this.nodeInterviewFailed.bind(this))
    .on('wake up', this.nodeWakeUp.bind(this))
    .on('sleep', this.nodeSleep.bind(this))
    .on('alive', this.nodeAlive.bind(this))
    .on('dead', this.nodeDead.bind(this))
    .on('value added', this.valueAdded.bind(this))
    .on('value updated', this.valueUpdated.bind(this))
    .on('value notification', this.valueNotification.bind(this))
    .on('value removed', this.valueRemoved.bind(this))
    .on('metadata update', this.metadataUpdate.bind(this))
    .on('notification', this.notification.bind(this))
    .on('statistics updated', this.statisticsUpdated.bind(this));

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_ADDED,
    payload: nodeId,
  });
}

module.exports = {
  nodeAdded,
};
