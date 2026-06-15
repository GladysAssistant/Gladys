const { expect } = require('chai');
const { compareTimes, parseTimeToMinutes, isTimeWithinRange } = require('../../../../services/mcp/lib/compareTimes');

describe('compareTimes', () => {
  it('should parse common time formats', () => {
    expect(parseTimeToMinutes('14:22')).to.equal(14 * 60 + 22);
    expect(parseTimeToMinutes('7h05')).to.equal(7 * 60 + 5);
    expect(parseTimeToMinutes('invalid')).to.equal(null);
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

  it('should compare two times with before and after operators', () => {
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
  });

  it('should support ranges crossing midnight', () => {
    expect(isTimeWithinRange(23 * 60 + 30, 22 * 60, 2 * 60)).to.equal(true);
    expect(isTimeWithinRange(12 * 60, 22 * 60, 2 * 60)).to.equal(false);
  });
});
