const logger = require('../../../../utils/logger');

/**
 * @description When a value is removed.
 * @param {Object} node - Node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function valueRemoved(node, args) {
  const { commandClass, endpoint, property, propertyKey /* , newValue */ } = args;
  const nodeId = node.id;
  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  logger.debug(
    `Zwave : Value removed, nodeId = ${nodeId}, comClass = ${commandClass}, endpoint = ${endpoint}, property = ${fullProperty}`,
  );
  if (
    this.nodes[nodeId].classes[commandClass] &&
    this.nodes[nodeId].classes[commandClass][endpoint][fullProperty]
  ) {
    delete this.nodes[nodeId].classes[commandClass][endpoint][fullProperty];
  }
}

module.exports = {
  valueRemoved,
};
