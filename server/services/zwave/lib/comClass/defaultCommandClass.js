const { transformValue, normalizeValue } = require('../utils/valueBinders');

/**
 * @description Get the command class ID.
 *
 * @returns {number} - Command Class ID.
 *
 * @example commandClass.getId();
 */
function getId() {
  return -1;
}

/**
 * @description Get the value following a value changed event.
 *
 * @param {Object} node - The node the value changed occurs.
 * @param {Object} valueChanged - The value changed.
 *
 * @returns {Object} - A zWave value.
 *
 * @example
 *     const changedValue = comClass.getChangedValue(node, value);
 */
function getChangedValue(node, valueChanged) {
  return valueChanged;
}

/**
 * @description Transform a value according to the Command Class.
 *
 * @param {Object} node - Node of the value.
 * @param {number} comClass - Command Class Id of the value.
 * @param {number} index - Index of the value.
 * @param {number} instance - Instance of the value.
 * @param {any} value - Value to transform.
 *
 * @returns {any} The transformed value.
 *
 * @example comClass.getTransformedValue(node, 110, 0, 1, 50);
 */
function getTransformedValue(node, comClass, index, instance, value) {
  return transformValue(node.classes[comClass][index][instance].type, value);
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
  return normalizeValue(node.classes[comClass][index][instance].type, value);
}

/**
 * @description Get the Min/Max values for a given value.
 *
 * @param {Object} node - Node to get the min/max from.
 * @param {number} comClass - ComClassId of the value to get the min/max.
 * @param {number} index - Index of the value to get the min/max.
 * @param {number} instance - Instance of the value to get the min/max.
 *
 * @returns {Object} Returns min and max values for a given value.
 *
 * @example const {min, max, step} = commClass.getMinMax(node, comClassId, index, instance);
 */
function getMinMax(node, comClass, index, instance) {
  return {
    min: node.classes[comClass][index][instance].min,
    max: node.classes[comClass][index][instance].max,
    step: 1,
  };
}

module.exports = {
  getId,
  getChangedValue,
  getTransformedValue,
  getNormalizedValue,
  getMinMax,
};
