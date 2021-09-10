const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

/**
 * @description When a value changed.
 * @param {number} nodeId - The ID of the node.
 * @param {Object} args - Zwave ValueUpdatedArgs.
 * @example
 * zwave.on('value updated', this.valueUpdated);
 */
function valueUpdated(nodeId, args) {
  const { commandClass, endpoint, property, propertyKey/* , prevValue */, newValue } = args;
  logger.debug(
    `Zwave : Value Updated, nodeId = ${nodeId}, comClass = ${commandClass}, value = ${JSON.stringify(newValue)}`,
  );
  if (this.nodes[nodeId].ready) {
    logger.debug(
      'node%d: changed: %d:%s:%s->%s',
      nodeId,
      commandClass,
      property + propertyKey ? `/${propertyKey}` : '',
      this.nodes[nodeId].classes[commandClass][endpoint][property + propertyKey ? `/${propertyKey}` : ''].value,
      newValue,
    );
    this.nodes[nodeId].classes[commandClass][endpoint][property + propertyKey ? `/${propertyKey}` : ''] = newValue;
    this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId(args),
      state: newValue,
    });
  }
}

module.exports = {
  valueUpdated,
};
