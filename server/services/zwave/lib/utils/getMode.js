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
    return VALUE_MODES.READ_ONLY;
  }

  if (zwaveValue.write_only) {
    return VALUE_MODES.WRITE_ONLY;
  }

  return VALUE_MODES.READ_WRITE;
}

module.exports = {
  getMode,
};
