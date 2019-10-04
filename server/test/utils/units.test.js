const { expect } = require('chai');
const { hslToRgb, celsiusToFahrenheit, fahrenheitToCelsius } = require('../../utils/units');

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
