/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const { expect } = require('chai');

const { normalizeBoolean, normalizeTemperatureUnit } = require('../../../../../services/tuya/lib/utils/tuya.normalize');
const { DEVICE_FEATURE_UNITS } = require('../../../../../utils/constants');

describe('Tuya normalize utils', () => {
  it('should normalize booleans', () => {
    expect(normalizeBoolean(true)).to.equal(true);
    expect(normalizeBoolean(1)).to.equal(true);
    expect(normalizeBoolean('true')).to.equal(true);
    expect(normalizeBoolean('1')).to.equal(true);
    expect(normalizeBoolean('false')).to.equal(false);
  });

  it('should normalize temperature unit to celsius', () => {
    expect(normalizeTemperatureUnit('c')).to.equal(DEVICE_FEATURE_UNITS.CELSIUS);
    expect(normalizeTemperatureUnit('℃')).to.equal(DEVICE_FEATURE_UNITS.CELSIUS);
    expect(normalizeTemperatureUnit('celsius')).to.equal(DEVICE_FEATURE_UNITS.CELSIUS);
    expect(normalizeTemperatureUnit('centigrade')).to.equal(DEVICE_FEATURE_UNITS.CELSIUS);
    expect(normalizeTemperatureUnit('celcius')).to.equal(DEVICE_FEATURE_UNITS.CELSIUS);
    expect(normalizeTemperatureUnit(DEVICE_FEATURE_UNITS.CELSIUS)).to.equal(DEVICE_FEATURE_UNITS.CELSIUS);
  });

  it('should normalize temperature unit to fahrenheit', () => {
    expect(normalizeTemperatureUnit('f')).to.equal(DEVICE_FEATURE_UNITS.FAHRENHEIT);
    expect(normalizeTemperatureUnit('℉')).to.equal(DEVICE_FEATURE_UNITS.FAHRENHEIT);
    expect(normalizeTemperatureUnit('fahrenheit')).to.equal(DEVICE_FEATURE_UNITS.FAHRENHEIT);
    expect(normalizeTemperatureUnit(DEVICE_FEATURE_UNITS.FAHRENHEIT)).to.equal(DEVICE_FEATURE_UNITS.FAHRENHEIT);
  });

  it('should return null for unknown temperature unit', () => {
    expect(normalizeTemperatureUnit(null)).to.equal(null);
    expect(normalizeTemperatureUnit(undefined)).to.equal(null);
    expect(normalizeTemperatureUnit('kelvin')).to.equal(null);
  });
});
