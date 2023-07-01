const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureExternalId } = require('../utils/externalId');
const { unbindValue } = require('../utils/bindValue');
const { PROPERTIES } = require('../constants');

/**
 * @description When a value changed.
 * @param {object} zwaveNode - ZWave Node.
 * @param {object} args - ValueUpdatedArgs.
 * @example
 * zwave.on('value updated', this.valueUpdated);
 */
function valueUpdated(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey, /* prevValue, */ newValue } = args;
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  if (!node) {
    logger.info(`Node ${nodeId} not available. By-pass message`);
    return;
  }

  // Current value is the final state of target value
  if (property === PROPERTIES.CURRENT_VALUE) {
    args.property = PROPERTIES.TARGET_VALUE;
    args.propertyName = PROPERTIES.TARGET_VALUE;
    args.writeable = true;
    valueUpdated.bind(this)(zwaveNode, args);
    return;
  }

  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  args.fullProperty = fullProperty;
  const newValueUnbind = unbindValue(args, newValue);
  logger.debug(
    `Value Updated: nodeId = ${nodeId}, comClass = ${commandClass}, endpoint = ${endpoint}, property = ${fullProperty}: ${node.classes[commandClass][endpoint][fullProperty].value} > ${newValueUnbind}`,
  );

  if (node.ready) {
    node.classes[commandClass][endpoint][fullProperty].value = newValueUnbind;
    const deviceFeatureExternalId = getDeviceFeatureExternalId({
      nodeId,
      commandClass,
      endpoint: endpoint || 0,
      property: fullProperty,
    });
    const deviceFeature = this.gladys.stateManager.get('deviceFeatureByExternalId', deviceFeatureExternalId);
    if (deviceFeature && newValueUnbind !== undefined && newValueUnbind !== null) {
      this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: deviceFeatureExternalId,
        state: newValueUnbind,
      });
    }
  }
}

module.exports = {
  valueUpdated,
};
