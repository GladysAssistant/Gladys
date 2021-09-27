const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When a node is added.
 * @param {Object} zwaveNode - The node added.
 * @example
 * zwave.on('node added', this.nodeAdded);
 */
function nodeAdded(zwaveNode) {
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Node Added, nodeId = ${nodeId}`);

  this.nodes[nodeId] = {
    manufacturer: '',
    manufacturerid: '',
    product: '',
    producttype: '',
    productid: '',
    type: '',
    name: '',
    location: '',
    classes: {},
    ready: false,
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
    .on('notification', this.notification.bind(this));

  /*
  // Is called when a node wakes up
    .on('wake up', this.onNodeWakeUp.bind(this))
  // Is called when a node goes to sleep
	  .on('sleep', this.onNodeSleep.bind(this))
  // Is called when a previously dead node starts communicating again
	  .on('alive', this.onNodeAlive.bind(this))
  // Is called when a node is marked as dead
	  .on('dead', this.onNodeDead.bind(this))
  // Is called when a node interview is completed
	  .on('interview completed', this.onNodeInterviewCompleted.bind(this))
  // This is called when a node's firmware was updated
	  .on('firmware update finished', this.onNodeFirmwareUpdated.bind(this))
  */

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_ADDED,
    payload: nodeId,
  });
}

module.exports = {
  nodeAdded,
};
