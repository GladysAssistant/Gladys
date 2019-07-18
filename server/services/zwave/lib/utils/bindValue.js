const { COMMAND_CLASSES, INDEXES } = require('../constants');

/**
 * @description Bind value
 * @param {Object} value - Value object.
 * @returns {Object} Return the category in Gladys.
 * @example
 * const { category, type } = getCategory({
 *  class_id: 49,
 *  index: 1,
 * });
 */
function bindValue(value, productId, comclass, index) {
  // Zipato Mini Keypad RFID
  if (
    productId === '0x4501' &&
    comclass === COMMAND_CLASSES.COMMAND_CLASS_ALARM &&
    index === INDEXES.INDEX_ALARM_ACCESS_CONTROL
  ) {
    return value === 6 ? 0 : 1;
  }
  return value;
}

module.exports = {
  bindValue,
};
