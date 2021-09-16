const logger = require('../../../../utils/logger');

/**
 * @description Notification about a node
 * @param {Object} zwaveNode - Node.
 * @param {Object} args - ZWave ValueNotificationArgs.
 * @example
 * zwave.on('value notification', this.valueNotification);
 */
function valueNotification(zwaveNode, args) {
  // const { commandClass, endpoint, property, propertyKey, value } = args;
  const nodeId = zwaveNode.id;
  logger.debug(`Zwave : Value Notification, nodeId = ${nodeId}, notif = ${JSON.stringify(args)}`);
}

module.exports = {
  valueNotification,
};
