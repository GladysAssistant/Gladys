const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { PROPERTIES } = require('../constants');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

/**
 * @description When a value is removed.
 * @param {Object} zwaveNode - ZWave Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @returns {Object} None.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function valueRemoved(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey } = args;
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
    valueRemoved.bind(this)(zwaveNode, args);
    return;
  }

  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  logger.debug(
    `Value Removed: nodeId = ${nodeId}, comClass = ${commandClass}, endpoint = ${endpoint}, property = ${fullProperty}`,
  );
  if (node.classes[commandClass] && node.classes[commandClass][endpoint][fullProperty]) {
    delete node.classes[commandClass][endpoint][fullProperty];
    const deviceFeatureExternalId = getDeviceFeatureExternalId({
      nodeId,
      commandClass,
      endpoint: endpoint || 0,
      property: fullProperty,
    });
    const deviceFeature = this.gladys.stateManager.get('deviceFeatureByExternalId', deviceFeatureExternalId);
    if (deviceFeature) {
      this.eventManager.emit(EVENTS.DEVICE.ADD_FEATURE, {
        device_feature_external_id: deviceFeatureExternalId,
      });
    }
  }
}

module.exports = {
  valueRemoved,
};
