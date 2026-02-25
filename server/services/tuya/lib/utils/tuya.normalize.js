const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');

const normalizeBoolean = (value) => {
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
};

const normalizeTemperatureUnit = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value)
    .trim()
    .toLowerCase();
  if (
    normalized === 'c' ||
    normalized === '℃' ||
    normalized === 'celsius' ||
    normalized === 'centigrade' ||
    normalized === 'celcius' ||
    normalized === DEVICE_FEATURE_UNITS.CELSIUS
  ) {
    return DEVICE_FEATURE_UNITS.CELSIUS;
  }
  if (
    normalized === 'f' ||
    normalized === '℉' ||
    normalized === 'fahrenheit' ||
    normalized === DEVICE_FEATURE_UNITS.FAHRENHEIT
  ) {
    return DEVICE_FEATURE_UNITS.FAHRENHEIT;
  }
  return null;
};

module.exports = {
  normalizeBoolean,
  normalizeTemperatureUnit,
};
