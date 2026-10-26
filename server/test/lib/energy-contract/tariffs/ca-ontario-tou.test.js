const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// Canada, Ontario TOU: on-peak / mid-peak / off-peak windows that swap between winter and summer,
// weekends and holidays entirely off-peak.
const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
const winter = { from: '11-01', to: '04-30' };
const summer = { from: '05-01', to: '10-31' };
const businessDay = { weekdays, not_calendar: { 'holidays-ca-on': 'holiday' } };
const tariff = {
  tariff_version: 1,
  calendars: ['holidays-ca-on'],
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        {
          label: 'On-peak',
          when: {
            ...businessDay,
            season: winter,
            time: [
              ['07:00', '11:00'],
              ['17:00', '19:00'],
            ],
          },
          price: 0.158,
        },
        { label: 'Mid-peak', when: { ...businessDay, season: winter, time: [['11:00', '17:00']] }, price: 0.122 },
        { label: 'On-peak', when: { ...businessDay, season: summer, time: [['11:00', '17:00']] }, price: 0.158 },
        {
          label: 'Mid-peak',
          when: {
            ...businessDay,
            season: summer,
            time: [
              ['07:00', '11:00'],
              ['17:00', '19:00'],
            ],
          },
          price: 0.122,
        },
      ],
      fallback: { label: 'Off-peak', price: 0.076 },
    },
  ],
};
const toronto = { timezone: 'America/Toronto' };
// Family Day 2026: Monday 16 February
const calendars = createCalendarLookup({ 'holidays-ca-on': { granularity: 'day', timezone: 'America/Toronto' } }, [
  { calendar_key: 'holidays-ca-on', date: '2026-02-16', value: 'holiday' },
]);

describe('tariffs: Canada Ontario TOU', () => {
  it('should swap the windows between seasons and free weekends and holidays', () => {
    const { costs } = price(
      tariff,
      toronto,
      [
        interval('2026-01-12T13:00:00Z', 1), // Monday 12 January 08:00 EST: winter on-peak
        interval('2026-01-12T17:00:00Z', 1), // 12:00: winter mid-peak
        interval('2026-07-06T12:00:00Z', 1), // Monday 6 July 08:00 EDT: summer mid-peak
        interval('2026-07-06T16:00:00Z', 1), // 12:00: summer on-peak
        interval('2026-07-05T16:00:00Z', 1), // Sunday: off-peak
        interval('2026-02-16T17:00:00Z', 1), // Family Day noon: off-peak
      ],
      { calendars },
    );
    const byStart = Object.fromEntries(costs.map((c) => [c.starts_at, c.label]));
    expect(byStart['2026-01-12T13:00:00.000Z']).to.equal('On-peak');
    expect(byStart['2026-01-12T17:00:00.000Z']).to.equal('Mid-peak');
    expect(byStart['2026-07-06T12:00:00.000Z']).to.equal('Mid-peak');
    expect(byStart['2026-07-06T16:00:00.000Z']).to.equal('On-peak');
    expect(byStart['2026-07-05T16:00:00.000Z']).to.equal('Off-peak');
    expect(byStart['2026-02-16T17:00:00.000Z']).to.equal('Off-peak');
  });
});
