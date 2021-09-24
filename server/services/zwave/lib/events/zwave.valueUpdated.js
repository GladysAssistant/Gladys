const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

/**
 * @description When a value changed.
 * @param {Object} zwaveNode - Node.
 * @param {Object} args - ValueUpdatedArgs.
 * @example
 * zwave.on('value updated', this.valueUpdated);
 */
function valueUpdated(zwaveNode, args) {
  logger.debug(`${zwaveNode.id}${JSON.stringify(args)}`);
  const { commandClass, endpoint, property, propertyKey, prevValue, newValue } = args;
  const nodeId = zwaveNode.id;
  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  /*logger.debug(
    `Zwave : Value Updated, nodeId = ${nodeId}, comClass = ${commandClass}, property = ${fullProperty}, prevValue = ${JSON.stringify(prevValue)}, newValue = ${JSON.stringify(newValue)}`,
  );*/
  if (this.nodes[nodeId].ready) {
    logger.debug(
      'node%d: changed: %d:%s:%s:%s->%s',
      nodeId,
      commandClass,
      endpoint,
      fullProperty,
      this.nodes[nodeId].classes[commandClass][endpoint][fullProperty].value,
      newValue,
    );
    this.nodes[nodeId].classes[commandClass][endpoint][fullProperty].value = newValue;
    this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId({
        nodeId,
        commandClass,
        endpoint: endpoint || 0,
        property: fullProperty,
      }),
      state: newValue,
    });
  }
}

module.exports = {
  valueUpdated,
};
