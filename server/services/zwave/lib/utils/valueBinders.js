const { INDEXES, COMMAND_CLASSES } = require('../constants');

const valueBinders = {
  bool: {
    transform: (value) => value !== '0' && !!value,
    normalize: (value) => value,
  },
};
const typeBinders = Object.keys(valueBinders);

/**
 * @description Is there any Binder for this type?
 *
 * @param {string} type - Type to look for.
 *
 * @returns {boolean} True if any. False otherwise.
 *
 * @example hasBinder('bool');
 */
function hasBinder(type) {
  return typeBinders.indexOf(type) !== -1;
}

/**
 * @description Transform a Normalized value (used by Gladys domain) to
 * a zWave value.
 *
 * @param {Object} node - Node of the value.
 * @param {number} comClass - Command Class Id of the value.
 * @param {number} index - Index of the value.
 * @param {number} instance - Instance of the value.
 * @param {any} value - Value to transform.
 *
 * @returns {any} The transformed value for zWave.
 *
 * @example
 *  const val = transformValue('bool', value);
 */
function transformValue(node, comClass, index, instance, value) {
  const type = node.classes[comClass][index][instance].type;
  if (!hasBinder(type)) {
    return value;
  }

  return valueBinders[type].transform(value);
}

/**
 * @description Normalize a value (to be used by Gladys domain)
 *
 * @param {Object} node - Node of the value.
 * @param {number} comClass - Command Class Id of the value.
 * @param {number} index - Index of the value.
 * @param {number} instance - Instance of the value.
 * @param {any} value - Value to transform.
 *
 * @returns {any} The normalized value.
 *
 * @example
 *  const val = normalizeValue('bool', value);
 */
function normalizeValue(node, comClass, index, instance, value) {
  if (comClass === COMMAND_CLASSES.COMMAND_CLASS_ALARM 
    && index === INDEXES.INDEX_ALARM_ACCESS_CONTROL && node.productid === '0x4501') {
      // AlarmCommandClass
      // Zipato Mini Keypad RFID
      return value === 6 ? 0 : 1;
  }

  const type = node.classes[comClass][index][instance].type;

  if (!hasBinder(type)) {
    return value;
  }

  return valueBinders[type].normalize(value);
}

module.exports = {
  transformValue,
  normalizeValue,
};
