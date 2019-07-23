const { COMMAND_CLASSES, INDEXES } = require('../constants');

/**
 * @description Bind value
 * @param {Object} value - Value object.
 * @param {string} productId - ProductId string.
 * @param {number} comclass - The comclass.
 * @param {number} index - The index.
 * @returns {number} Return the value adapted.
 * @example
 * const value = bindValue(6, 0x4501, 12, 1);
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
