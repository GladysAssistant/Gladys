const { expect } = require('chai');

const { convertUnit } = require('../../../../../../services/tuya/lib/device/tuya.convertUnit');
const { DEVICE_FEATURE_UNITS } = require('../../../../../../utils/constants');

describe('Tuya convert unit', () => {
  it('convert celsius', () => {
    const result = convertUnit('°C');
    expect(result).to.eq(DEVICE_FEATURE_UNITS.CELSIUS);
  });
  it('convert fahrentheit', () => {
    const result = convertUnit('°F');
    expect(result).to.eq(DEVICE_FEATURE_UNITS.FAHRENHEIT);
  });

  it('convert unknown', () => {
    const result = convertUnit('unknown');
    expect(result).to.eq(null);
  });

  it('convert undefined', () => {
    const result = convertUnit(undefined);
    expect(result).to.eq(null);
  });
});
