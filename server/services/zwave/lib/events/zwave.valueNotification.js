const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { unbindValue } = require('../utils/bindValue');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

/**
 * @description Notification about a node
 * @param {Object} zwaveNode - ZWave Node.
 * @param {Object} args - ZWave ValueNotificationArgs.
 * @example
 * valueNotification({ id: 0, }, { commandClass: 0, endpoint: 0, property: '', propertyKey: '' }, 0);
 */
function valueNotification(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey, value } = args;
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  const valueUnbind = unbindValue(args, value);
  logger.debug(
    `Value Notification: nodeId = ${nodeId} (Ready: ${node.ready}), comClass = ${commandClass}, endpoint = ${endpoint}, property = ${fullProperty}: ${valueUnbind}`,
  );
  if (node.ready) {
    node.classes[commandClass][endpoint || 0][fullProperty].value = valueUnbind;
    const deviceFeatureExternalId = getDeviceFeatureExternalId({
      nodeId,
      commandClass,
      endpoint: endpoint || 0,
      property: fullProperty,
    });
    const deviceFeature = this.gladys.stateManager.get('deviceFeatureByExternalId', deviceFeatureExternalId);
    if (deviceFeature) {
      this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: deviceFeatureExternalId,
        state: valueUnbind,
      });
    }
  }
}

module.exports = {
  valueNotification,
};
