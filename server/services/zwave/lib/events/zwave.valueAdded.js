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
  if (zwaveNode.getValueMetadata) {
    return zwaveNode.getValueMetadata(args);
  }
  return zwaveNode.getValueMetadata;
}

/**
 * ValueAddedArgs.
 *
 * @description When a value is added.
 * @param {Object} zwaveNode - ZWave Node.
 * @param {Object} args - ZWaveNodeValueAddedArgs.
 * @example
 * valueAdded(9, {});
 */
function valueAdded(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey } = args;
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  logger.debug(`Value Added: nodeId = ${nodeId}, comClass = ${commandClass}[${endpoint}], property = ${fullProperty}`);
  if (!node.classes[commandClass]) {
    node.classes[commandClass] = {};
  }
  if (!node.classes[commandClass][endpoint]) {
    node.classes[commandClass][endpoint] = {};
    // New Endpoint - split allowed
  }

  const metadata = getValueMetadata(zwaveNode, args);
  node.classes[commandClass][endpoint][fullProperty] = {
    nodeId,
    genre: GENRE[commandClass] || 'user',
    min: metadata.min || 0,
    max: metadata.max || 1,
    label: `${metadata.label}${endpoint && endpoint > 0 ? ` (${endpoint})` : ''}`,
    commandClass,
    endpoint,
    property: fullProperty,
    read_only: !metadata.writeable,
  };
}

module.exports = {
  valueAdded,
};
