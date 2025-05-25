const { expect } = require('chai');
const { hslToRgb, celsiusToFahrenheit, fahrenheitToCelsius, convertUnitDistance } = require('../../utils/units');
const { DEVICE_FEATURE_UNITS } = require('../../utils/constants');

const DISTANCE_UNITS = { US: 'us', METRIC: 'metric' };

describe('celsiusToFahrenheit', () => {
  it('should convert celsius to fahrenheit', () => {
    const fahrenheit = celsiusToFahrenheit(20);
    expect(fahrenheit).to.equal(68);
  });
});

describe('fahrenheitToCelsius', () => {
  it('should convert fahrenheit to celsius', () => {
    const celsius = fahrenheitToCelsius(68);
    expect(celsius).to.equal(20);
  });
});

describe('hslToRgb', () => {
  it('should convert hsl to rgb', () => {
    const rgb = hslToRgb(214, 1, 0.5);
    expect(rgb).to.deep.equal([0, 110, 255]);
  });
});

describe('convertUnitDistance', () => {
  it('converts kilometers to miles (US preference)', () => {
    const result = convertUnitDistance(10, DEVICE_FEATURE_UNITS.KM, DISTANCE_UNITS.US);
    expect(result.value).to.be.closeTo(6.21, 0.01);
    expect(result.unit).to.equal(DEVICE_FEATURE_UNITS.MILE);
  });

  it('converts miles to kilometers (metric preference)', () => {
    const result = convertUnitDistance(10, DEVICE_FEATURE_UNITS.MILE, DISTANCE_UNITS.METRIC);
    expect(result.value).to.be.closeTo(16.1, 0.01);
    expect(result.unit).to.equal(DEVICE_FEATURE_UNITS.KM);
  });

  it('converts meters to feet (US preference)', () => {
    const result = convertUnitDistance(2, DEVICE_FEATURE_UNITS.M, DISTANCE_UNITS.US);
    expect(result.value).to.be.closeTo(6.56, 0.01);
    expect(result.unit).to.equal(DEVICE_FEATURE_UNITS.FEET);
  });

  it('converts feet to meters (metric preference)', () => {
    const result = convertUnitDistance(3, DEVICE_FEATURE_UNITS.FEET, DISTANCE_UNITS.METRIC);
    expect(result.value).to.be.closeTo(0.91, 0.01);
    expect(result.unit).to.equal(DEVICE_FEATURE_UNITS.M);
  });

  it('converts inches to mm (metric preference, <10)', () => {
    const result = convertUnitDistance(2, DEVICE_FEATURE_UNITS.INCH, DISTANCE_UNITS.METRIC);
    expect(result.value).to.be.closeTo(50.8, 0.01);
    expect(result.unit).to.equal(DEVICE_FEATURE_UNITS.MM);
  });

  it('converts inches to cm (metric preference, >=10)', () => {
    const result = convertUnitDistance(12, DEVICE_FEATURE_UNITS.INCH, DISTANCE_UNITS.METRIC);
    expect(result.value).to.be.closeTo(30.5, 0.01);
    expect(result.unit).to.equal(DEVICE_FEATURE_UNITS.CM);
  });

  it('returns the original value if no conversion', () => {
    const result = convertUnitDistance(5, DEVICE_FEATURE_UNITS.KM, 'unknown');
    expect(result.value).to.equal(5);
    expect(result.unit).to.equal(DEVICE_FEATURE_UNITS.KM);
  });
});
