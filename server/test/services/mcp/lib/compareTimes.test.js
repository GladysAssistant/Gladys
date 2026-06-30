const { expect } = require('chai');
const {
  compareTimes,
  parseTimeToMinutes,
  isTimeWithinRange,
  formatMinutesAsTime,
} = require('../../../../services/mcp/lib/compareTimes');

describe('compareTimes', () => {
  it('should parse common time formats and reject invalid values', () => {
    expect(parseTimeToMinutes('14:22')).to.equal(14 * 60 + 22);
    expect(parseTimeToMinutes('7h05')).to.equal(7 * 60 + 5);
    expect(parseTimeToMinutes('14:22:30')).to.equal(14 * 60 + 22);
    expect(parseTimeToMinutes('invalid')).to.equal(null);
    expect(parseTimeToMinutes('')).to.equal(null);
    expect(parseTimeToMinutes('24:00')).to.equal(null);
    expect(parseTimeToMinutes('12:60')).to.equal(null);
    expect(formatMinutesAsTime(14 * 60 + 5)).to.equal('14:05');
    expect(formatMinutesAsTime(0)).to.equal('00:00');
  });

  it('should use the current home time when reference_time is omitted', () => {
    const result = compareTimes({
      operator: 'before',
      compare_to: '23:59',
      now: new Date('2026-06-15T12:30:00Z'),
      timezone: 'Europe/Paris',
    });

    expect(result.reference_time).to.equal('14:30');
    expect(result.result).to.equal(true);
  });

  it('should detect when reference time is inside one of several ranges', () => {
    const result = compareTimes({
      operator: 'in_ranges',
      reference_time: '12:00',
      ranges: [
        { start: '07:00', end: '08:45' },
        { start: '11:45', end: '13:15' },
        { start: '17:00', end: '22:00' },
      ],
    });

    expect(result.result).to.equal(true);
    expect(result.matching_range).to.deep.equal({ start: '11:45', end: '13:15' });
  });

  it('should detect when reference time is outside all ranges', () => {
    const result = compareTimes({
      operator: 'in_ranges',
      reference_time: '14:22',
      ranges: [
        { start: '07:00', end: '08:45' },
        { start: '11:45', end: '13:15' },
        { start: '17:00', end: '22:00' },
      ],
    });

    expect(result.result).to.equal(false);
    expect(result.matching_range).to.equal(null);
    expect(result.next_range).to.deep.equal({ start: '17:00', end: '22:00' });
  });

  it('should return null next_range when all ranges are in the past', () => {
    const result = compareTimes({
      operator: 'in_ranges',
      reference_time: '23:00',
      ranges: [{ start: '07:00', end: '08:45' }],
    });

    expect(result.result).to.equal(false);
    expect(result.next_range).to.equal(null);
  });

  it('should pick the earliest future range when several are available', () => {
    const result = compareTimes({
      operator: 'in_ranges',
      reference_time: '14:22',
      ranges: [
        { start: '20:00', end: '21:00' },
        { start: '17:00', end: '18:00' },
      ],
    });

    expect(result.next_range).to.deep.equal({ start: '17:00', end: '18:00' });
  });

  it('should handle empty ranges', () => {
    const result = compareTimes({
      operator: 'in_ranges',
      reference_time: '14:22',
      ranges: [],
    });

    expect(result.result).to.equal(false);
    expect(result.matching_range).to.equal(null);
    expect(result.next_range).to.equal(null);
    expect(result.ranges_checked).to.deep.equal([]);
  });

  it('should compare two times with before, after and same operators', () => {
    expect(
      compareTimes({
        operator: 'before',
        reference_time: '14:22',
        compare_to: '17:00',
      }).result,
    ).to.equal(true);

    expect(
      compareTimes({
        operator: 'after',
        reference_time: '18:00',
        compare_to: '17:00',
      }).result,
    ).to.equal(true);

    expect(
      compareTimes({
        operator: 'same',
        reference_time: '17:00',
        compare_to: '17:00',
      }).result,
    ).to.equal(true);
  });

  it('should reject invalid inputs and unsupported operators', () => {
    expect(() =>
      compareTimes({
        operator: 'in_ranges',
        reference_time: 'bad',
        ranges: [{ start: '07:00', end: '08:00' }],
      }),
    ).to.throw('Invalid reference_time');

    expect(() =>
      compareTimes({
        operator: 'in_ranges',
        reference_time: '12:00',
        ranges: [{ start: 'bad', end: '08:00' }],
      }),
    ).to.throw('Invalid range');

    expect(() =>
      compareTimes({
        operator: 'before',
        reference_time: '12:00',
        compare_to: 'bad',
      }),
    ).to.throw('Invalid compare_to');

    expect(() =>
      compareTimes({
        operator: 'unknown',
        reference_time: '12:00',
        compare_to: '13:00',
      }),
    ).to.throw('Unsupported operator');
  });

  it('should support ranges crossing midnight', () => {
    expect(isTimeWithinRange(23 * 60 + 30, 22 * 60, 2 * 60)).to.equal(true);
    expect(isTimeWithinRange(12 * 60, 22 * 60, 2 * 60)).to.equal(false);
  });
});
