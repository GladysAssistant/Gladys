const logger = require('../../../../utils/logger');
const { GENRE } = require('../constants');

/**
 * ValueAddedArgs.
 *
 * @description When a value is added.
 * @param {Object} zwaveNode - Node.
 * @param {Object} args - ZWaveNodeValueAddedArgs.
 * @example
 * valueAdded(9, {});
 */
function valueAdded(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey } = args;
  const nodeId = zwaveNode.id;
  const instance = property + (propertyKey ? `-${propertyKey}` : '');
  logger.debug(
    `Zwave : Value Added, nodeId = ${nodeId}, comClass = ${commandClass}[${endpoint}], instance = ${instance}`,
  );
  if (!this.nodes[nodeId].classes[commandClass]) {
    this.nodes[nodeId].classes[commandClass] = {};
  }
  if (!this.nodes[nodeId].classes[commandClass][endpoint]) {
    this.nodes[nodeId].classes[commandClass][endpoint] = {};
    // New Endpoint - split allowed
  }

  const metadata = zwaveNode.getValueMetadata(args);
  this.nodes[nodeId].classes[commandClass][endpoint][instance] = {
    genre: GENRE[commandClass] || 'user',
    min: metadata.min || 0,
    max: metadata.max || 1,
    label: metadata.label,
    class_id: commandClass,
    index: endpoint,
    instance,
    read_only: !metadata.writeable
  };
}

module.exports = {
  valueAdded,
};
