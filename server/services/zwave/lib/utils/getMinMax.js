const { COMMAND_CLASSES, INDEXES } = require('../constants');
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
 * @example const {min, max} = getMinMax(node, comClassId, index, instance);
 */
 function getMinMax(node, comClass, index, instance) {
     if (COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL === comClass 
        && INDEXES.INDEX_SWITCH_MULTILEVEL_LEVEL === index) {
            return {
                min: 0,
                max: 99,
              };
        }

        return {
            min: node.classes[comClass][index][instance].min,
            max: node.classes[comClass][index][instance].max,
        };
  }

module.exports = {
    getMinMax,
};
