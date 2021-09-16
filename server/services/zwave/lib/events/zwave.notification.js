const logger = require('../../../../utils/logger');

const NOTIFICATION_TYPES = {
  0: 'Message complete',
  1: 'Timeout',
  2: 'Nop',
  3: 'Node Awake',
  4: 'Node sleep',
  5: 'Node dead',
  6: 'Node alive',
};

/**
 * @description Notification about a node
 * @param {Object} zwaveNode - Node.
 * @param {Object} notif - Number of the type of notification.
 * @example
 * zwave.on('notification', this.notification);
 */
function notification(zwaveNode, notif) {
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Notification, nodeId = ${nodeId}, notif = ${NOTIFICATION_TYPES[notif]}`);
}

module.exports = {
  notification,
};
