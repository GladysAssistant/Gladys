const { expect } = require('chai');

const { normalizeBoolean, normalizeTemperatureUnit } = require('../../../../../services/tuya/lib/utils/tuya.normalize');
const { DEVICE_FEATURE_UNITS } = require('../../../../../utils/constants');

describe('Tuya normalize utils', () => {
  it('should normalize known boolean truthy values', () => {
    expect(normalizeBoolean('ON')).to.equal(true);
  });

  it('should return null for unknown temperature units', () => {
    expect(normalizeTemperatureUnit('kelvin')).to.equal(null);
  });

  it('should normalize celsius aliases', () => {
    expect(normalizeTemperatureUnit('celcius')).to.equal(DEVICE_FEATURE_UNITS.CELSIUS);
  });
});
