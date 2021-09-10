const logger = require('../../../../utils/logger');

/**
 * @description When a value is removed.
 * @param {number} nodeId - The ID of the node.
 * @param {Object} args - Zwave ValueRemovedArgs.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function valueRemoved(nodeId, args) {
  const {commandClass, endpoint, property, propertyKey, newValue } = args;
  logger.debug(
    `Zwave : Value removed, nodeId = ${nodeId}, comClass = ${commandClass}, index = ${endpoint}, instance = ${property + propertyKey ? `/${propertyKey}` : ''}`,
  );
  if (this.nodes[nodeId].classes[commandClass] && this.nodes[nodeId].classes[commandClass][endpoint][property + propertyKey ? `/${propertyKey}` : '']) {
    delete this.nodes[nodeId].classes[commandClass][endpoint][property + propertyKey ? `/${propertyKey}` : ''];
  }
}

module.exports = {
  valueRemoved,
};
