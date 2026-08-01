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
      age: null,
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
      age: null,
    });
  });

  it('should format shutter:state values', () => {
    expect(formatValue({ category: 'shutter', type: 'state', last_value: COVER_STATE.OPEN })).to.deep.equal({
      value: 'open',
      unit: null,
      age: null,
    });
    expect(formatValue({ category: 'shutter', type: 'state', last_value: COVER_STATE.CLOSE })).to.deep.equal({
      value: 'closed',
      unit: null,
      age: null,
    });
    expect(formatValue({ category: 'shutter', type: 'state', last_value: COVER_STATE.STOP })).to.deep.equal({
      value: 'stopped',
      unit: null,
      age: null,
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
      age: null,
    });
  });

  it('should format switch:binary values', () => {
    expect(formatValue({ category: 'switch', type: 'binary', last_value: 1 })).to.deep.equal({
      value: 'on',
      unit: null,
      age: null,
    });
  });

  it('should format curtain:state values and fallback for unknown state', () => {
    expect(formatValue({ category: 'curtain', type: 'state', last_value: COVER_STATE.OPEN })).to.deep.equal({
      value: 'open',
      unit: null,
      age: null,
    });
    expect(formatValue({ category: 'shutter', type: 'state', last_value: 42 })).to.deep.equal({
      value: 42,
      unit: null,
      age: null,
    });
  });

  it('should format light:color as hexadecimal color', () => {
    expect(formatValue({ category: 'light', type: 'color', last_value: 255 })).to.deep.equal({
      value: '#0000ff',
      unit: null,
      age: null,
    });
    expect(formatValue({ category: 'light', type: 'color', last_value: 16711680 })).to.deep.equal({
      value: '#ff0000',
      unit: null,
      age: null,
    });
    expect(formatValue({ category: 'light', type: 'color', last_value: null })).to.deep.equal({
      value: null,
      unit: null,
      age: null,
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
      age: null,
    });
  });

  it('should report the age of the value in minutes, hours and days', () => {
    const now = new Date('2026-07-12T12:00:00.000Z').getTime();
    const buildFeature = (lastValueChanged) => ({
      category: 'temperature-sensor',
      type: 'decimal',
      last_value: 22.5,
      unit: '°C',
      last_value_changed: lastValueChanged,
    });

    expect(formatValue(buildFeature('2026-07-12T11:48:00.000Z'), now).age).to.eq('12min');
    expect(formatValue(buildFeature('2026-07-12T09:00:00.000Z'), now).age).to.eq('3h');
    expect(formatValue(buildFeature('2026-07-06T12:00:00.000Z'), now).age).to.eq('6d');
  });

  it('should report a fresh value as 0min', () => {
    const now = new Date('2026-07-12T12:00:00.000Z').getTime();
    const feature = {
      category: 'humidity-sensor',
      type: 'decimal',
      last_value: 52,
      unit: '%',
      last_value_changed: new Date('2026-07-12T12:00:00.000Z'),
    };

    expect(formatValue(feature, now).age).to.eq('0min');
  });

  it('should report a value dated in the future as fresh', () => {
    const now = new Date('2026-07-12T12:00:00.000Z').getTime();
    const feature = {
      category: 'humidity-sensor',
      type: 'decimal',
      last_value: 52,
      unit: '%',
      last_value_changed: '2026-07-12T14:00:00.000Z',
    };

    expect(formatValue(feature, now).age).to.eq('0min');
  });

  it('should return a null age when last_value_changed is missing or invalid', () => {
    const now = new Date('2026-07-12T12:00:00.000Z').getTime();

    expect(formatValue({ category: 'humidity-sensor', type: 'decimal', last_value: 52 }, now).age).to.eq(null);
    expect(
      formatValue({ category: 'humidity-sensor', type: 'decimal', last_value: 52, last_value_changed: 'nope' }, now)
        .age,
    ).to.eq(null);
  });

  it('should treat a Unix epoch timestamp as a date, not as a missing value', () => {
    const feature = {
      category: 'humidity-sensor',
      type: 'decimal',
      last_value: 52,
      unit: '%',
      last_value_changed: 0,
    };

    expect(formatValue(feature, 0).age).to.eq('0min');
    expect(formatValue(feature, new Date('1970-01-03T00:00:00.000Z').getTime()).age).to.eq('2d');
  });

  it('should keep the age of a stale sensor that stopped reporting', () => {
    const now = new Date('2026-07-12T12:00:00.000Z').getTime();
    const feature = {
      category: 'humidity-sensor',
      type: 'decimal',
      last_value: 52.2,
      unit: '%',
      last_value_changed: '2026-06-12T12:00:00.000Z',
    };

    expect(formatValue(feature, now)).to.deep.equal({
      value: 52.2,
      unit: '%',
      age: '30d',
    });
  });
});
