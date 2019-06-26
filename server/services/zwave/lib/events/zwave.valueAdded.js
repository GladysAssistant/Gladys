const logger = require('../../../../utils/logger');

/**
 * @description When a value is added.
 * @param {number} nodeId - The ID of the node.
 * @param {number} comClass - Zwave comclass.
 * @param {Object} valueId - The value id.
 * @example
 * zwave.on('value added', this.valueAdded);
 */
function valueAdded(nodeId, comClass, valueId) {
  logger.debug(`Zwave : Value Added, nodeId = ${nodeId}, comClass = ${comClass}, valueId = ${JSON.stringify(valueId)}`);
  if (!this.nodes[nodeId].classes[comClass]) {
    this.nodes[nodeId].classes[comClass] = {};
  }
  this.nodes[nodeId].classes[comClass][valueId.index] = valueId;
}

module.exports = {
  valueAdded,
};
