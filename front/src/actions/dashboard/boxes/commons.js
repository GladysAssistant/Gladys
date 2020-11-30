const { DEVICE_FEATURE_UNITS } = require('../../../../../server/utils/constants');
 
const formatUnitToDisplay = unit => {
  let result;
  switch (unit) {
    case DEVICE_FEATURE_UNITS.PERCENT:
      result = '%';
      break;
    case DEVICE_FEATURE_UNITS.CELSIUS:
      result = '°C';
      break;
    case DEVICE_FEATURE_UNITS.FAHRENHEIT:
      result = '°F';
      break;
    case DEVICE_FEATURE_UNITS.WATT:
      result = 'W';
      break;
    case DEVICE_FEATURE_UNITS.KILOWATT:
      result = 'kW';
      break;
    case DEVICE_FEATURE_UNITS.KILOWATT_HOUR:
      result = 'kW/h';
      break;
    case DEVICE_FEATURE_UNITS.LUX:
      result = 'Lx';
      break;
    case DEVICE_FEATURE_UNITS.PASCAL:
      result = 'Pa';
      break;
    case DEVICE_FEATURE_UNITS.AMPERE:
      result = 'A';
      break;
    case DEVICE_FEATURE_UNITS.VOLT:
      result = 'V';
      break;
    case DEVICE_FEATURE_UNITS.PPM:
      result = 'ppm';
      break;
    case DEVICE_FEATURE_UNITS.KILOGRAM:
      result = 'kg';
      break;
    case DEVICE_FEATURE_UNITS.CENTIMETER:
      result = 'cm';
      break;
    case DEVICE_FEATURE_UNITS.MERCURE_MILIMETER:
      result = 'mmHg';
      break;
    case DEVICE_FEATURE_UNITS.BEATS_PER_MINUTE:
      result = 'bpm';
      break;
    case DEVICE_FEATURE_UNITS.METER_PER_SECOND:
      result = 'm/s';
      break;
    default:
      result = unit;
  }

  return result;
}

module.exports = {
  formatUnitToDisplay
};
