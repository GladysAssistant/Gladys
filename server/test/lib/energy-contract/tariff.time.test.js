const { expect } = require('chai');
const dayjs = require('dayjs');
const time = require('../../../lib/energy-contract/tariff.time');

describe('energy-contract tariff.time', () => {
  it('should parse time and month-day labels', () => {
    expect(time.parseTimeToMinutes('06:30')).to.equal(390);
    expect(time.parseTimeToMinutes('24:00')).to.equal(1440);
    expect(time.parseMonthDay('11-01')).to.equal(1101);
  });
  it('should know the days of a month and format dates', () => {
    expect(time.getDaysInMonth(2024, 2)).to.equal(29);
    expect(time.getDaysInMonth(2026, 2)).to.equal(28);
    expect(time.getDaysInMonth(2026, 12)).to.equal(31);
    expect(time.formatDate(2026, 1, 5)).to.equal('2026-01-05');
    expect(time.splitDate('2026-01-05')).to.deep.equal({ year: 2026, month: 1, day: 5 });
  });
  it('should add days with calendar arithmetic', () => {
    expect(time.addDays('2026-01-31', 1)).to.equal('2026-02-01');
    expect(time.addDays('2026-01-01', -1)).to.equal('2025-12-31');
    expect(time.addDays('2024-02-28', 2)).to.equal('2024-03-01');
  });
  it('should convert a local wall-clock time to an instant', () => {
    expect(time.localToUtcMs('2026-01-05', 'Europe/Paris')).to.equal(Date.UTC(2026, 0, 4, 23));
    expect(time.localToUtcMs('2026-07-05', 'Europe/Paris', '06:00')).to.equal(Date.UTC(2026, 6, 5, 4));
    expect(time.localToUtcMs('2026-01-05', 'Etc/GMT')).to.equal(Date.UTC(2026, 0, 5));
  });
  it('should describe an instant in a timezone', () => {
    expect(time.getLocalContext(Date.UTC(2026, 0, 12, 7), 'Europe/Paris')).to.deep.equal({
      date: '2026-01-12',
      year: 2026,
      month: 1,
      day: 12,
      monthDay: 112,
      minutes: 480,
      weekday: 1,
    });
    // 23:30 UTC on Saturday is already Sunday 08:30 in Tokyo
    const tokyo = time.getLocalContext(Date.UTC(2026, 0, 17, 23, 30), 'Asia/Tokyo');
    expect(tokyo.date).to.equal('2026-01-18');
    expect(tokyo.weekday).to.equal(0);
    expect(tokyo.minutes).to.equal(510);
  });
  it('should read the local clock of a clock-change day exactly, minute by minute', () => {
    // a day without a change has one offset, a clock-change day has none (exact conversion)
    expect(time.getDayOffsetMinutes(Date.UTC(2026, 0, 12, 7), 'Europe/Paris')).to.equal(60);
    expect(time.getDayOffsetMinutes(Date.UTC(2026, 2, 29, 7), 'Europe/Paris')).to.equal(null);
    // Paris, Lord Howe (30-minute change) and Kathmandu (+05:45) around their clock changes
    [
      ['Europe/Paris', Date.UTC(2026, 2, 29, 0, 0), Date.UTC(2026, 2, 29, 2, 0)],
      ['Europe/Paris', Date.UTC(2026, 9, 25, 0, 0), Date.UTC(2026, 9, 25, 2, 0)],
      ['Australia/Lord_Howe', Date.UTC(2026, 9, 3, 14, 30), Date.UTC(2026, 9, 3, 16, 30)],
      ['Asia/Kathmandu', Date.UTC(2026, 0, 12, 18, 0), Date.UTC(2026, 0, 12, 18, 30)],
    ].forEach(([tz, fromMs, toMs]) => {
      for (let ms = fromMs; ms <= toMs; ms += 60 * 1000) {
        const local = dayjs(ms).tz(tz);
        const context = time.getLocalContext(ms, tz);
        expect([context.date, context.minutes, context.weekday]).to.deep.equal([
          local.format('YYYY-MM-DD'),
          local.hour() * 60 + local.minute(),
          local.day(),
        ]);
      }
    });
  });

  it('should keep a bounded cache', () => {
    const cache = time.createBoundedCache(2);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).to.equal(1);
    expect(cache.size()).to.equal(2);
    // full: emptied before the next entry
    cache.set('c', 3);
    expect(cache.get('a')).to.equal(undefined);
    expect(cache.get('c')).to.equal(3);
    expect(cache.size()).to.equal(1);
  });

  it('should compute day bounds, clock-change days included', () => {
    expect(time.getDayBounds('2026-01-12', 'Europe/Paris').durationMinutes).to.equal(1440);
    expect(time.getDayBounds('2026-03-29', 'Europe/Paris').durationMinutes).to.equal(1380);
    expect(time.getDayBounds('2026-10-25', 'Europe/Paris').durationMinutes).to.equal(1500);
    const bounds = time.getDayBounds('2026-01-12', 'Europe/Paris');
    expect(bounds.startMs).to.equal(Date.UTC(2026, 0, 11, 23));
    expect(bounds.endMs).to.equal(Date.UTC(2026, 0, 12, 23));
  });
  it('should count the days between two dates', () => {
    expect(time.daysBetween('2026-01-01', '2026-02-01')).to.equal(31);
    expect(time.daysBetween('2024-02-01', '2024-03-01')).to.equal(29);
    expect(time.daysBetween('2026-01-15', '2026-01-15')).to.equal(0);
    expect(time.daysBetween('2026-01-15', '2026-01-10')).to.equal(-5);
  });
  it('should compute month bounds', () => {
    const february = time.getMonthBounds('2026-02-10', 'Europe/Paris');
    expect(february.durationMinutes).to.equal(28 * 1440);
    expect(february.id).to.equal('2026-02');
    expect(february.startDate).to.equal('2026-02-01');
    expect(february.endDate).to.equal('2026-03-01');
    const december = time.getMonthBounds('2026-12-05', 'UTC');
    expect(december.endMs).to.equal(Date.UTC(2027, 0, 1));
    expect(december.endDate).to.equal('2027-01-01');
    expect(december.startMs).to.equal(Date.UTC(2026, 11, 1));
  });
  it('should find the start of a billing period, clamping short months', () => {
    expect(time.getBillingPeriodStart('2026-02-03', 5)).to.equal('2026-01-05');
    expect(time.getBillingPeriodStart('2026-02-05', 5)).to.equal('2026-02-05');
    expect(time.getBillingPeriodStart('2026-01-03', 5)).to.equal('2025-12-05');
    expect(time.getBillingPeriodStart('2026-02-28', 31)).to.equal('2026-02-28');
    expect(time.getBillingPeriodStart('2026-03-01', 31)).to.equal('2026-02-28');
    expect(time.getBillingPeriodStart('2026-03-31', 31)).to.equal('2026-03-31');
    expect(time.getBillingPeriodStart('2026-03-30', 31)).to.equal('2026-02-28');
    expect(time.getBillingPeriodStart('2026-01-15', 1)).to.equal('2026-01-01');
  });
  it('should compute billing period bounds across the year end', () => {
    const period = time.getBillingPeriodBounds('2026-12-20', 15, 'UTC');
    expect(period.id).to.equal('2026-12-15');
    expect(period.startMs).to.equal(Date.UTC(2026, 11, 15));
    expect(period.endMs).to.equal(Date.UTC(2027, 0, 15));
    expect(period.durationMinutes).to.equal(31 * 1440);
    expect(period.startDate).to.equal('2026-12-15');
    expect(period.endDate).to.equal('2027-01-15');
    const clamped = time.getBillingPeriodBounds('2026-01-31', 31, 'UTC');
    expect(clamped.id).to.equal('2026-01-31');
    expect(clamped.endMs).to.equal(Date.UTC(2026, 1, 28));
    expect(clamped.endDate).to.equal('2026-02-28');
  });
  it('should give the period ids of a date', () => {
    expect(time.getPeriodIds('2026-02-03', 5, 'Europe/Paris')).to.deep.equal({
      day: '2026-02-03',
      month: '2026-02',
      billing_period: '2026-01-05',
    });
  });
  it('should compile time intervals and test minutes against them', () => {
    expect(time.compileTimeIntervals([['22:00', '06:00']])).to.deep.equal([
      { start: 1320, end: 1440 },
      { start: 0, end: 360 },
    ]);
    expect(time.compileTimeIntervals([['00:00', '24:00']])).to.deep.equal([{ start: 0, end: 1440 }]);
    expect(time.compileTimeIntervals([['06:00', '06:00']])).to.deep.equal([
      { start: 360, end: 1440 },
      { start: 0, end: 360 },
    ]);
    const ranges = time.compileTimeIntervals([['22:00', '06:00']]);
    expect(time.isInTimeRanges(ranges, 30)).to.equal(true);
    expect(time.isInTimeRanges(ranges, 1320)).to.equal(true);
    expect(time.isInTimeRanges(ranges, 360)).to.equal(false);
    expect(time.isInTimeRanges(ranges, 720)).to.equal(false);
  });
});
