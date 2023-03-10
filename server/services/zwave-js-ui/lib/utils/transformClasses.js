const cloneDeep = require('lodash.clonedeep');
const { COMMAND_CLASSES, PROPERTIES } = require('../constants');

/**
 * @description Return filtered classes (e.g. manage command classs version).
 * @param {Object} node - Z-Wave node.
 * @returns {Object} Return filtered classes.
 * @example
 * const filteredClasses = zwaveManager.transformClasses({});
 */
function transformClasses(node) {
  const filteredClasses = cloneDeep(node.classes);
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
  return filteredClasses;
}

module.exports = {
  transformClasses,
};
