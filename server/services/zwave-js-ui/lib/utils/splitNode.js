const cloneDeep = require('lodash.clonedeep');
const logger = require('../../../../utils/logger');

/**
 * @description Split Node into each endpoints.
 * @param {object} node - Z-Wave node .
 * @returns {Array} Splitted nodes.
 * @example
 * const nodes = zwaveManager.splitNode({});
 */
function splitNode(node) {
  if (node.endpoints.length < 2) {
    node.endpoint = 0;
    return node;
  }

  // Temporary remove endpoints for clone
  const { endpoints } = node;
  node.endpoints = undefined;

  const commonNode = cloneDeep(node);
  commonNode.endpoint = 0;

  const nodes = [commonNode];
  endpoints.forEach((endpoint) => {
    const eNode = cloneDeep(node);
    eNode.endpoint = endpoint.index;
    eNode.classes = {};
    Object.keys(node.classes).forEach((comclass) => {
      const valuesClass = node.classes[comclass];
      if (valuesClass[endpoint.index]) {
        eNode.classes[comclass] = {};
        eNode.classes[comclass][endpoint.index] = valuesClass[endpoint.index];
      }
      if (commonNode.classes[comclass]) {
        delete commonNode.classes[comclass][endpoint.index];
      }
    });
    nodes.push(eNode);
  });
  logger.debug(`splitNode: got ${nodes.length} devices`);

  node.endpoints = endpoints;

  return nodes;
}

module.exports = {
  splitNode,
};
