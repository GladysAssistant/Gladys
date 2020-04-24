const logger = require('../../../../utils/logger');

/**
 * @description When a value is removed.
 * @param {number} nodeId - The ID of the node.
 * @param {number} comClass - Zwave comclass.
 * @param {number} index - The index of the value.
 * @param {number} instance - The instance of the value.
 * @example
 * zwave.on('value removed', this.valueRemoved);
 */
function valueRemoved(nodeId, comClass, index, instance) {
  logger.debug(`Zwave : Value removed, nodeId = ${nodeId}, comClass = ${comClass}, index = ${index}, instance = ${instance}`);
  if (this.nodes[nodeId].classes[comClass] && this.nodes[nodeId].classes[comClass][index][instance]) {
    delete this.nodes[nodeId].classes[comClass][index][instance];
  }
}

module.exports = {
  valueRemoved,
};
