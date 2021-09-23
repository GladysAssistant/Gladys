const logger = require('../../../../utils/logger');
const { GENRE } = require('../constants');

/**
 *
 * @description Get value metadata.
 * @param {Object} zwaveNode - Node.
 * @param {Object} args - ZWaveNodeValueAddedArgs.
 * @returns {Object} ZWaveNode value metadata.
 * @example
 * getValueMetadata(9, {});
 */
function getValueMetadata(zwaveNode, args) {
  if(zwaveNode.getValueMetadata ) {
    return zwaveNode.getValueMetadata(args);
  }
  return zwaveNode.getValueMetadata;
}

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
  logger.debug(`${zwaveNode.id}${JSON.stringify(args)}`);
  const { commandClass, endpoint, property, propertyKey } = args;
  const nodeId = zwaveNode.id;
  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  /* logger.debug(
    `Zwave : Value Added, nodeId = ${nodeId}, comClass = ${commandClass}[${endpoint}], property = ${fullProperty}`,
  ); */
  if (!this.nodes[nodeId].classes[commandClass]) {
    this.nodes[nodeId].classes[commandClass] = {};
  }
  if (!this.nodes[nodeId].classes[commandClass][endpoint]) {
    this.nodes[nodeId].classes[commandClass][endpoint] = {};
    // New Endpoint - split allowed
  }

  const metadata = getValueMetadata(zwaveNode, args);
  this.nodes[nodeId].classes[commandClass][endpoint][fullProperty] = {
    nodeId,
    genre: GENRE[commandClass] || 'user',
    min: metadata.min || 0,
    max: metadata.max || 1,
    label: metadata.label,
    commandClass,
    endpoint,
    property: fullProperty,
    read_only: !metadata.writeable
  };
}

module.exports = {
  valueAdded,
};
