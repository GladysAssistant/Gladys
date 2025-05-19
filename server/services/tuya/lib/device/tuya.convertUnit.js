const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');

/**
 * @description Convert Tuya unit into gladys unit.
 * @param {string} tuyaUnit - Tuya unit.
 * @returns {string} gladys unit.
 * @example
 * convertUnit(tuyaUnit);
 */
function convertUnit(tuyaUnit) {
  switch (tuyaUnit) {
    case '°C':
      return DEVICE_FEATURE_UNITS.CELSIUS;
    case '°F':
      return DEVICE_FEATURE_UNITS.FAHRENHEIT;
    default:
      return null;
  }
}

module.exports = {
  convertUnit,
};
