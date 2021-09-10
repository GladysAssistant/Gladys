const logger = require('../../../../utils/logger');

/**
 * ValueAddedArgs.
 *
 * @description When a value is added.
 * @param {number} nodeId - The ID of the node.
 * @param {Object} args - ValueAddedArgs.
 * @example
 * valueAdded(9, {});
 */
function valueAdded(nodeId, args) {
  const { commandClass, endpoint, property, propertyKey, newValue } = args;
  logger.debug(
    `Zwave : Value Added, nodeId = ${nodeId}, comClass = ${commandClass}, valueId = ${JSON.stringify(newValue)}`,
  );
  if (!this.nodes[nodeId].classes[commandClass]) {
    this.nodes[nodeId].classes[commandClass] = {};
  }
  if (!this.nodes[nodeId].classes[commandClass][endpoint]) {
    this.nodes[nodeId].classes[commandClass][endpoint] = {};
    // New Endpoint - split allowed
  }
  this.nodes[nodeId].classes[commandClass][endpoint][property + propertyKey ? `/${propertyKey}` : ''] = newValue;
}

module.exports = {
  valueAdded,
};
