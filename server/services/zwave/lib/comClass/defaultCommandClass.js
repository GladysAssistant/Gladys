const { transformValue, normalizeValue } = require('../utils/valueBinders');

const DefaultCommandClass = function DefaultCommandClass() {};

DefaultCommandClass.prototype = {
  /**
   * @description Get the command class ID.
   *
   * @returns {number} - Command Class ID.
   *
   * @example commandClass.getId();
   */
  getId: function getId() {
    return -1;
  },
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
  getChangedValue: function getChangedValue(node, valueChanged) {
    return valueChanged;
  },
  /**
   * @description Transform a value according to the Command Class.
   *
   * @param {Object} node - Node of the value.
   * @param {number} comClass - Command Class Id of the value.
   * @param {number} index - Index of the value.
   * @param {any} value - Value to transform.
   *
   * @returns {any} The transformed value.
   *
   * @example comClass.getTransformedValue(node, 110, 0, 50);
   */
  getTransformedValue: function getTransformedValue(node, comClass, index, value) {
    return transformValue(node.classes[comClass][index].type, value);
  },
  /**
   * @description Normalize a value according to the Command Class.
   *
   * @param {Object} node - Node of the value.
   * @param {number} comClass - Command Class Id of the value.
   * @param {number} index - Index of the value.
   * @param {any} value - Value to transform.
   *
   * @returns {any} The normalized value.
   *
   * @example comClass.getNormalizedValue(node, 110, 0, 50);
   */
  getNormalizedValue: function getNormalizedValue(node, comClass, index, value) {
    return normalizeValue(node.classes[comClass][index].type, value);
  },
  /**
   * @description Get the Min/Max values for a given value.
   *
   * @param {Object} node - Node to get the min/max from.
   * @param {number} comClassId - Command Class Id to get the min/max.
   * @param {number} index - Index of the value to get the min/max.
   *
   * @returns {Object} Returns min and max values for a given value.
   *
   * @example const {min, max} = commClass.getMinMax(node, comClassId, index);
   */
  getMinMax: function getMinMax(node, comClassId, index) {
    return {
      min: node.classes[comClassId][index].min,
      max: node.classes[comClassId][index].max,
    };
  },
};

module.exports = {
  instance: new DefaultCommandClass(),
  DefaultCommandClass,
};
