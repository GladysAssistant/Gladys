const logger = require('../../../../utils/logger');

/* const NOTIFICATION_TYPES = {
  0: 'Message complete',
  1: 'Timeout',
  2: 'Nop',
  3: 'Node Awake',
  4: 'Node sleep',
  5: 'Node dead',
  6: 'Node alive',
}; */

/**
 * @description Notification about a node
 * @param {Object} zwaveNode - ZWave Node.
 * @param {Object} commandClass - CommandClass.
 * @param {Object} args - CommandClass arguments.
 * @example
 * zwave.on('notification', this.notification);
 */
function notification(zwaveNode, commandClass, args) {
  const nodeId = zwaveNode.id;
  logger.debug(`Value Notification: nodeId = ${nodeId}, comClass = ${commandClass}: ${args}`);
}

module.exports = {
  notification,
};
