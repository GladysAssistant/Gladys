const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

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

  this.nodes[nodeId].on('ready', this.nodeReady.bind(this));
  this.nodes[nodeId].on('value added', this.valueAdded.bind(this));
  this.nodes[nodeId].on('value updated', this.valueUpdated.bind(this));
  this.nodes[nodeId].on('value notification', this.valueNotification.bind(this));
  this.nodes[nodeId].on('value removed', this.valueRemoved.bind(this));
  this.nodes[nodeId].on('notification', this.notification.bind(this));

  /*
  // Is called when a node wakes up
  this.nodes[nodeId].on('wake up', this.onNodeWakeUp.bind(this));
  // Is called when a node goes to sleep
	this.nodes[nodeId].on('sleep', this.onNodeSleep.bind(this));
  // Is called when a previously dead node starts communicating again
	this.nodes[nodeId].on('alive', this.onNodeAlive.bind(this));
  // Is called when a node is marked as dead
	this.nodes[nodeId].on('dead', this.onNodeDead.bind(this));
  // Is called when a node interview is completed
	this.nodes[nodeId].on('interview completed', this.onNodeInterviewCompleted.bind(this));
  // This is called when a node's firmware was updated
	this.nodes[nodeId].on('firmware update finished', this.onNodeFirmwareUpdated.bind(this));
  */

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.NODE_ADDED,
    payload: nodeId,
  });

}

module.exports = {
  nodeAdded,
};
