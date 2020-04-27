const { VALUE_MODES } = require('../constants');

/**
 * @description Get the value Mode.
 * @param {Object} zwaveValue - Z-Wave Value.
 * 
 * @returns {number} Return the mode.
 * @example
 * const mode = getMode(value);
 */
function getMode(zwaveValue) {
  if (zwaveValue.read_only) {
      return VALUE_MODES.READ;
  }

  if (zwaveValue.write_only) {
      return VALUE_MODES.WRITE;
  }

  return VALUE_MODES.READ | VALUE_MODES.WRITE;
}

module.exports = {
  getMode,
};
