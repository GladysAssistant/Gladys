const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');

/**
 * @description Convert Z-Wave unit in Gladys unit.
 * @param {string} zwaveUnit - Unit in Z-Wave.
 * @returns {string} Return the unit in Gladys.
 * @example
 * const unit = getUnit('C');
 */
function getUnit(zwaveUnit) {
  switch (zwaveUnit) {
    case 'C':
      return DEVICE_FEATURE_UNITS.CELSIUS;
    case 'F':
      return DEVICE_FEATURE_UNITS.FAHRENHEIT;
    case '%':
      return DEVICE_FEATURE_UNITS.PERCENT;
    case 'lux':
      return DEVICE_FEATURE_UNITS.LUX;
    default:
      return null;
  }
}

module.exports = {
  getUnit,
};
