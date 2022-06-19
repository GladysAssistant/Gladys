const cloneDeep = require('lodash.clonedeep');
const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { COMMAND_CLASSES } = require('../constants');

/**
 * @description Split Node into each endpoints.
 * @param {Object} node - Z-Wave node .
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
  const endpoints = node.endpoints;
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

/**
 * @description Split Node into each scene classes.
 * @param {Object} node - Z-Wave node .
 * @returns {Array} Splitted nodes.
 * @example
 * const nodes = zwaveManager.splitNodeWithScene({});
 */
function splitNodeWithScene(node) {
  if (
    node.classes[COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE] === undefined ||
    node.classes[COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE][0] === undefined
  ) {
    return node;
  }
  const nodes = [node];
  let i = 1;
  Object.keys(node.classes[COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE][0])
    .filter((sceneProperty) => {
      return sceneProperty !== 'slowRefresh';
    })
    .forEach((sceneProperty) => {
      const eNode = Object.assign({}, node);
      eNode.endpoint = i;
      eNode.classes = {};
      eNode.classes[COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE] = {
        i: {
          sceneProperty: {
            property: sceneProperty,
            genre: 'user',
            label: sceneProperty,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
            unit: 'number',
            min: 0,
            max: 1,
            commandClass: COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE,
            endpoint: i,
            writeable: false,
          },
        },
      };
      nodes.push(eNode);
      i += 1;
    });
  logger.debug(`splitNodeWithScene: got ${nodes.length} devices`);
  return nodes;
}

module.exports = {
  splitNode,
  splitNodeWithScene,
};
