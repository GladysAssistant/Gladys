const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

/**
 * @description Notification about a node
 * @param {Object} zwaveNode - Node.
 * @param {Object} args - ZWave ValueNotificationArgs.
 * @example
 * zwave.on('value notification', this.valueNotification);
 */
function valueNotification(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey, value } = args;
  const nodeId = zwaveNode.id;
  const instance = property + (propertyKey ? `-${propertyKey}` : '');
  logger.debug(`Zwave : Value Notification, nodeId = ${nodeId}, notif = ${JSON.stringify(args)}`);
  if (this.nodes[nodeId].ready) {
    logger.debug(
      'node%d: changed: %d:%s:%s:%s->%s',
      nodeId,
      commandClass,
      endpoint,
      instance,
      this.nodes[nodeId].classes[commandClass][endpoint || 0][instance].value,
      value,
    );
    this.nodes[nodeId].classes[commandClass][endpoint || 0][instance].value = value;
    this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId({
        nodeId,
        commandClass,
        endpoint: endpoint || 0, 
        instance
      }),
      state: value,
    });
  }
}

module.exports = {
  valueNotification,
};
