const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureExternalId } = require('../utils/externalId');
const { unbindValue } = require('../utils/bindValue');

/**
 * @description When a value changed.
 * @param {Object} zwaveNode - Node.
 * @param {Object} args - ValueUpdatedArgs.
 * @example
 * zwave.on('value updated', this.valueUpdated);
 */
function valueUpdated(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey, prevValue, newValue } = args;
  const nodeId = zwaveNode.id;
  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  const newValueUnbind = unbindValue(args, newValue);
  if (this.nodes[nodeId].ready) {
    logger.debug(
      'node%d: changed: %d:%s:%s %s->%s',
      nodeId,
      commandClass,
      endpoint,
      fullProperty,
      this.nodes[nodeId].classes[commandClass][endpoint][fullProperty].value,
      newValueUnbind,
    );
    if (prevValue !== newValue) {
      this.nodes[nodeId].classes[commandClass][endpoint][fullProperty].value = newValueUnbind;
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
          state: newValueUnbind,
        });
      }
    }
  }
}

module.exports = {
  valueUpdated,
};
