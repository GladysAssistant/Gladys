const { COMMAND_CLASSES, INDEXES } = require('../constants');
const DefaultCommandClass = require('./defaultCommandClass');

/**
 * @description Get the command class ID.
 *
 * @returns {number} Command Class ID.
 *
 * @example commandClass.getId();
 */
function getId() {
  return COMMAND_CLASSES.COMMAND_CLASS_ALARM;
}

/**
 * @description Normalize a value according to the Command Class.
 *
 * @param {Object} node - Node of the value.
 * @param {number} comClass - Command Class Id of the value.
 * @param {number} index - Index of the value.
 * @param {number} instance - Instance of the value.
 * @param {any} value - Value to transform.
 *
 * @returns {any} The normalized value.
 *
 * @example comClass.getNormalizedValue(node, 110, 0, 1, 50);
 */
function getNormalizedValue(node, comClass, index, instance, value) {
  // Zipato Mini Keypad RFID
  if (index === INDEXES.INDEX_ALARM_ACCESS_CONTROL && node.productid === '0x4501') {
    return value === 6 ? 0 : 1;
  }

  return DefaultCommandClass.getNormalizedValue(node, comClass, index, instance, value);
}

module.exports = {
  ...DefaultCommandClass,
  getId,
  getNormalizedValue,
};
