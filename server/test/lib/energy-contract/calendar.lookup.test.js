const { expect } = require('chai');
const { createCalendarLookup } = require('../../../lib/energy-contract/calendar.lookup');
const { getLocalContext } = require('../../../lib/energy-contract/tariff.time');

describe('energy-contract createCalendarLookup', () => {
  it('should answer undefined for an unknown calendar and list the known ones', () => {
    const lookup = createCalendarLookup();
    expect(lookup.get('tempo', Date.UTC(2026, 0, 12))).to.equal(undefined);
    expect(lookup.has('tempo')).to.equal(false);
    expect(lookup.keys()).to.deep.equal([]);
  });
  it('should read a daily calendar by local date with a day start shift', () => {
    const lookup = createCalendarLookup(
      { tempo: { granularity: 'day', timezone: 'Europe/Paris', day_starts_at: '06:00' } },
      [
        { calendar_key: 'tempo', date: '2026-01-12', value: 'red' },
        { calendar_key: 'tempo', starts_at: '2026-01-12T23:00:00Z', value: 'blue' }, // 13 January, Paris
        { calendar_key: 'tempo', starts_at: new Date(Date.UTC(2026, 0, 13, 23)), value: 'white' }, // 14 January
        { calendar_key: 'unknown', date: '2026-01-12', value: 'ignored' },
      ],
    );
    expect(lookup.has('tempo')).to.equal(true);
    expect(lookup.keys()).to.deep.equal(['tempo']);
    expect(lookup.get('tempo', Date.UTC(2026, 0, 12, 12))).to.equal('red');
    // 03:00 Paris on the 13th, before 06:00: still the colour of the 12th
    expect(lookup.get('tempo', Date.UTC(2026, 0, 13, 2))).to.equal('red');
    expect(lookup.get('tempo', Date.UTC(2026, 0, 13, 5))).to.equal('blue');
    expect(lookup.get('tempo', Date.UTC(2026, 0, 14, 12))).to.equal('white');
    expect(lookup.get('tempo', Date.UTC(2026, 0, 15, 12))).to.equal(undefined);
  });
  it('should reuse the caller local context when the timezone matches and recompute otherwise', () => {
    const lookup = createCalendarLookup({ holidays: { granularity: 'day', timezone: 'America/New_York' } }, [
      { calendar_key: 'holidays', date: '2026-07-04', value: 'holiday' },
    ]);
    // 01:00 UTC on 5 July is still 4 July in New York
    const ms = Date.UTC(2026, 6, 5, 1);
    const newYork = getLocalContext(ms, 'America/New_York');
    expect(lookup.get('holidays', ms, newYork, 'America/New_York')).to.equal('holiday');
    const paris = getLocalContext(ms, 'Europe/Paris');
    expect(paris.date).to.equal('2026-07-05');
    expect(lookup.get('holidays', ms, paris, 'Europe/Paris')).to.equal('holiday');
    expect(lookup.get('holidays', ms)).to.equal('holiday');
  });
  it('should default the granularity to day and the timezone to the contract one', () => {
    const lookup = createCalendarLookup(
      { holidays: {} },
      [{ calendar_key: 'holidays', starts_at: '2026-01-01T00:00:00+09:00', value: 'holiday' }],
      'Asia/Tokyo',
    );
    expect(lookup.get('holidays', Date.UTC(2026, 0, 1, 10))).to.equal('holiday');
    expect(lookup.get('holidays', Date.UTC(2025, 11, 31, 10))).to.equal(undefined);
  });
  it('should read a 30-minute calendar by exact start', () => {
    const lookup = createCalendarLookup({ spot: { granularity: 'thirty_minutes' } }, [
      { calendar_key: 'spot', starts_at: '2026-01-12T12:00:00Z', value: 0.12 },
      { calendar_key: 'spot', starts_at: new Date(Date.UTC(2026, 0, 12, 12, 30)), value: 0.15 },
    ]);
    expect(lookup.get('spot', Date.UTC(2026, 0, 12, 12))).to.equal(0.12);
    expect(lookup.get('spot', Date.UTC(2026, 0, 12, 12, 30))).to.equal(0.15);
    expect(lookup.get('spot', Date.UTC(2026, 0, 12, 13))).to.equal(undefined);
  });
  it('should read a 15-minute calendar by quarter and give the slot length of the sub-daily calendars', () => {
    const lookup = createCalendarLookup(
      {
        'spot-fi': { granularity: 'fifteen_minutes', timezone: 'Europe/Helsinki' },
        peaks: { granularity: 'thirty_minutes' },
        holidays: { granularity: 'day' },
      },
      [
        { calendar_key: 'spot-fi', starts_at: '2026-01-12T12:00:00Z', value: 0.04 },
        { calendar_key: 'spot-fi', starts_at: '2026-01-12T12:15:00Z', value: 0.09 },
      ],
    );
    expect(lookup.get('spot-fi', Date.UTC(2026, 0, 12, 12))).to.equal(0.04);
    expect(lookup.get('spot-fi', Date.UTC(2026, 0, 12, 12, 15))).to.equal(0.09);
    // an instant inside a quarter reads that quarter, a quarter without entry reads nothing
    expect(lookup.get('spot-fi', Date.UTC(2026, 0, 12, 12, 20))).to.equal(0.09);
    expect(lookup.get('spot-fi', Date.UTC(2026, 0, 12, 12, 30))).to.equal(undefined);
    expect(lookup.slotMinutes('spot-fi')).to.equal(15);
    expect(lookup.slotMinutes('peaks')).to.equal(30);
    expect(lookup.slotMinutes('holidays')).to.equal(undefined);
    expect(lookup.slotMinutes('unknown')).to.equal(undefined);
  });
  it('should read the second quarter of a 30-minute slot from that slot, on the calendar local clock', () => {
    const lookup = createCalendarLookup(
      {
        peaks: { granularity: 'thirty_minutes', timezone: 'Europe/Paris' },
        'peaks-np': { granularity: 'thirty_minutes', timezone: 'Asia/Kathmandu' },
      },
      [
        { calendar_key: 'peaks', starts_at: '2026-01-12T12:00:00Z', value: 'critical-peak' },
        // Asia/Kathmandu is UTC+05:45: the local 18:00 slot starts at 12:15Z
        { calendar_key: 'peaks-np', starts_at: '2026-01-12T12:15:00Z', value: 'critical-peak' },
      ],
    );
    const quarter = Date.UTC(2026, 0, 12, 12, 15);
    expect(lookup.get('peaks', quarter)).to.equal('critical-peak');
    // the local context of the caller is reused when it is in the calendar timezone
    expect(lookup.get('peaks', quarter, getLocalContext(quarter, 'Europe/Paris'), 'Europe/Paris')).to.equal(
      'critical-peak',
    );
    expect(lookup.get('peaks', Date.UTC(2026, 0, 12, 12, 30))).to.equal(undefined);
    // 12:30Z is 18:15 in Kathmandu, inside the local 18:00 slot; 12:00Z is 17:45, in the previous one
    expect(lookup.get('peaks-np', Date.UTC(2026, 0, 12, 12, 30))).to.equal('critical-peak');
    expect(lookup.get('peaks-np', Date.UTC(2026, 0, 12, 12, 0))).to.equal(undefined);
  });
});
