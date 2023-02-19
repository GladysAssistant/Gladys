const logger = require('../../../../utils/logger');

/**
 * @description When a value is removed.
 * @param {Object} zwaveNode - ZWave Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function valueRemoved(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey /* , newValue */ } = args;
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  if (!node) {
    logger.info(`Node ${nodeId} not available. By-pass message`);
    return;
  }

  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  logger.debug(
    `Value Removed: nodeId = ${nodeId}, comClass = ${commandClass}, endpoint = ${endpoint}, property = ${fullProperty}`,
  );
  if (node.classes[commandClass] && node.classes[commandClass][endpoint][fullProperty]) {
    delete node.classes[commandClass][endpoint][fullProperty];
  }
}

module.exports = {
  valueRemoved,
};
