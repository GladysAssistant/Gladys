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
  logger.debug(`${zwaveNode.id}${JSON.stringify(args)}`);
  const { commandClass, endpoint, property, propertyKey, value } = args;
  const nodeId = zwaveNode.id;
  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  logger.debug(`Zwave : Value Notification, nodeId = ${nodeId}, notif = ${JSON.stringify(args)}`);
  if (this.nodes[nodeId].ready) {
    logger.debug(
      'node%d: changed: %d:%s:%s %s->%s',
      nodeId,
      commandClass,
      endpoint || 0,
      fullProperty,
      this.nodes[nodeId].classes[commandClass][endpoint || 0][fullProperty].value,
      value,
    );
    this.nodes[nodeId].classes[commandClass][endpoint || 0][fullProperty].value = value;
    this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId({
        nodeId,
        commandClass,
        endpoint: endpoint || 0, 
        property: fullProperty
      }),
      state: value,
    });
  }
}

module.exports = {
  valueNotification,
};
