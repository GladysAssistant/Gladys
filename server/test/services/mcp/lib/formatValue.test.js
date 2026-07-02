const { expect } = require('chai');
const { COVER_STATE } = require('../../../../utils/constants');
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

  it('should format shutter:state values', () => {
    expect(formatValue({ category: 'shutter', type: 'state', last_value: COVER_STATE.OPEN })).to.deep.equal({
      value: 'open',
      unit: null,
    });
    expect(formatValue({ category: 'shutter', type: 'state', last_value: COVER_STATE.CLOSE })).to.deep.equal({
      value: 'closed',
      unit: null,
    });
    expect(formatValue({ category: 'shutter', type: 'state', last_value: COVER_STATE.STOP })).to.deep.equal({
      value: 'stopped',
      unit: null,
    });
  });

  it('should format opening-sensor:binary with value 1 as "closed"', () => {
    const result = formatValue({
      category: 'opening-sensor',
      type: 'binary',
      last_value: 1,
    });

    expect(result).to.deep.equal({
      value: 'closed',
      unit: null,
    });
  });

  it('should format switch:binary values', () => {
    expect(formatValue({ category: 'switch', type: 'binary', last_value: 1 })).to.deep.equal({
      value: 'on',
      unit: null,
    });
  });

  it('should format curtain:state values and fallback for unknown state', () => {
    expect(formatValue({ category: 'curtain', type: 'state', last_value: COVER_STATE.OPEN })).to.deep.equal({
      value: 'open',
      unit: null,
    });
    expect(formatValue({ category: 'shutter', type: 'state', last_value: 42 })).to.deep.equal({
      value: 42,
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
