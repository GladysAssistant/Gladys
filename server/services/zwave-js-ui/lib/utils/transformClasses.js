const cloneDeep = require('lodash.clonedeep');
const { COMMAND_CLASSES, PROPERTIES, PRODUCT } = require('../constants');

/**
 * @description Return filtered classes (e.g. Manage command classs version).
 * @param {object} node - Z-Wave node.
 * @returns {object} Return filtered classes.
 * @example
 * const filteredClasses = zwaveManager.transformClasses({});
 */
function transformClasses(node) {
  const filteredClasses = cloneDeep(node.classes);
  if (node.product === PRODUCT.FIBARO_DIMMER2) {
    node.endpointsCount = 1;
    if (filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL]) {
      delete filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL][0];
      delete filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL][2];
    }
  }
  if (filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY]) {
    if (
      filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY][0][PROPERTIES.ANY] &&
      filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY][0][PROPERTIES.MOTION]
    ) {
      delete filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY][0][PROPERTIES.ANY];
    }
    if (
      filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION] &&
      filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION][0]
    ) {
      delete filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION][0][PROPERTIES.MOTION_ALARM];
    }
  }
  /* if (filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL]) {
    filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY] = {};
    Object.keys(filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL]).forEach(endpoint => {
      filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY][endpoint] = {};
      filteredClasses[COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY][endpoint][PROPERTIES.TARGET_VALUE] = {
        id: `${node.nodeId}-${COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY}-${endpoint}-targetValue`,
        nodeId: node.nodeId,
        commandClass: COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY,
        endpoint,
        property: 'targetValue',
        type: 'number',
        readable: true,
        writeable: true,
        label: 'Target value',
        min: 0,
        max: 1,
        value: 0,
        genre: 'user',
      };
    });
  } */
  return filteredClasses;
}

module.exports = {
  transformClasses,
};
