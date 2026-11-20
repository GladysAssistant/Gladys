const { expect } = require('chai');

const { formatDateInUTC } = require('../../utils/date');

describe('formatDateInUTC', () => {
  it('should format a date as a UTC string with a microsecond fraction', () => {
    expect(formatDateInUTC(new Date('2023-06-15T08:00:00.500Z'))).to.equal('2023-06-15 08:00:00.500000+00');
    expect(formatDateInUTC(new Date('2023-06-15T08:00:00.005Z'))).to.equal('2023-06-15 08:00:00.005000+00');
    expect(formatDateInUTC(new Date('2023-06-15T08:00:00.000Z'))).to.equal('2023-06-15 08:00:00.000000+00');
  });

  it('should keep the value unchanged in another timezone', () => {
    // 2023-06-15 00:30:00.250 in UTC+8 is 2023-06-14 16:30:00.250 UTC
    expect(formatDateInUTC(new Date('2023-06-15T00:30:00.250+08:00'))).to.equal('2023-06-14 16:30:00.250000+00');
  });
});
