const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');

/**
 * @description Transform Zigbee unit to Gladys unit.
 * @param {string} deviceUnit - Zigbee unit.
 * @param {string} featureUnit - Default unit.
 * @returns {string} Tranformed unit.
 * @example mapUnit('°C', 'celsius');
 */
function mapUnit(deviceUnit, featureUnit) {
  switch (deviceUnit) {
    case '%':
      return DEVICE_FEATURE_UNITS.PERCENT;
    case 'hPa':
      return DEVICE_FEATURE_UNITS.HECTO_PASCAL;
    case 'ppm':
      return DEVICE_FEATURE_UNITS.PPM;
    case 'A':
      return DEVICE_FEATURE_UNITS.AMPERE;
    case 'V':
      return DEVICE_FEATURE_UNITS.VOLT;
    case 'mV':
      return DEVICE_FEATURE_UNITS.MILLI_VOLT;
    case 'W':
      return DEVICE_FEATURE_UNITS.WATT;
    case 'kWh':
      return DEVICE_FEATURE_UNITS.KILOWATT_HOUR;
    case '°C':
      return DEVICE_FEATURE_UNITS.CELSIUS;
    case '°F':
      return DEVICE_FEATURE_UNITS.FAHRENHEIT;
    case 'VA':
      return DEVICE_FEATURE_UNITS.VOLT_AMPERE;
    case 'VArh':
      return DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE;
    default:
      return featureUnit || null;
  }
}

module.exports = {
  mapUnit,
};
