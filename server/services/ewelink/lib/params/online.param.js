const { DEVICE_PARAMS } = require('../utils/constants');

/**
 * @description Convert online state.
 * @param {boolean} rawValue - Param raw value.
 * @returns {string} Converted value to Gladys param value.
 * @example
 * const gladysParamValue = convertValue(true);
 */
function convertValue(rawValue) {
  return rawValue ? '1' : '0';
}

module.exports = {
  EWELINK_KEY_PATH: 'online',
  GLADYS_PARAM_KEY: DEVICE_PARAMS.ONLINE,
  convertValue,
};
