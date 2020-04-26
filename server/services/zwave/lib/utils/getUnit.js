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
    case 'Lux':
      return DEVICE_FEATURE_UNITS.LUX;
    case 'A':
      return DEVICE_FEATURE_UNITS.AMPERE;
    case 'V':
      return DEVICE_FEATURE_UNITS.VOLT;
    case 'kWh':
      return DEVICE_FEATURE_UNITS.KILOWATT_HOUR;
    case 'W':
      return DEVICE_FEATURE_UNITS.WATT;
    case 'Watt':
      return DEVICE_FEATURE_UNITS.WATT;
    default:
      return null;
  }
}

module.exports = {
  getUnit,
};
