const { expect } = require('chai');
const { formatValue } = require('../../../../services/mcp/lib/formatValue');

describe('formatValue', () => {
  it('should format opening-sensor:binary with value 0 as "open"', () => {
    const feature = {
      category: 'opening-sensor',
      type: 'binary',
      last_value: 0,
    };

    const result = formatValue(feature);

    expect(result).to.deep.equal({
      value: 'open',
      unit: null,
    });
  });

  it('should format light:binary with value 0 as "off"', () => {
    const feature = {
      category: 'light',
      type: 'binary',
      last_value: 0,
    };

    const result = formatValue(feature);

    expect(result).to.deep.equal({
      value: 'off',
      unit: null,
    });
  });

  it('should format default case with value and unit', () => {
    const feature = {
      category: 'temperature-sensor',
      type: 'decimal',
      last_value: 22.5,
      unit: '°C',
    };

    const result = formatValue(feature);

    expect(result).to.deep.equal({
      value: 22.5,
      unit: '°C',
    });
  });
});
