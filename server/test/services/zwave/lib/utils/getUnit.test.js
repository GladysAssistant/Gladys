const { expect } = require('chai');
const { getUnit } = require('../../../../../services/zwave/lib/utils/getUnit');
const { DEVICE_FEATURE_UNITS } = require('../../../../../utils/constants');

describe('zwave.getUnit', () => {
  it('should return temperature unit', () => {
    const celsius = getUnit('C');
    const fahrenheit = getUnit('F');
    expect(celsius).to.equal(DEVICE_FEATURE_UNITS.CELSIUS);
    expect(fahrenheit).to.equal(DEVICE_FEATURE_UNITS.FAHRENHEIT);
  });
  it('should return percent unit', () => {
    const percent = getUnit('%');
    expect(percent).to.equal(DEVICE_FEATURE_UNITS.PERCENT);
  });
  it('should return luminosity unit', () => {
    const lux1 = getUnit('Lux');
    const lux2 = getUnit('lux');
    expect(lux1).to.equal(DEVICE_FEATURE_UNITS.LUX);
    expect(lux2).to.equal(DEVICE_FEATURE_UNITS.LUX);
  });
  it('should return electricity unit', () => {
    const ampere = getUnit('A');
    const volt = getUnit('V');
    const kilowatthour = getUnit('kWh');
    const watt1 = getUnit('W');
    const watt2 = getUnit('Watt');
    expect(ampere).to.equal(DEVICE_FEATURE_UNITS.AMPERE);
    expect(volt).to.equal(DEVICE_FEATURE_UNITS.VOLT);
    expect(kilowatthour).to.equal(DEVICE_FEATURE_UNITS.KILOWATT_HOUR);
    expect(watt1).to.equal(DEVICE_FEATURE_UNITS.WATT);
    expect(watt2).to.equal(DEVICE_FEATURE_UNITS.WATT);
  });
});
