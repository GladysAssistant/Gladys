const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// United States, ConEd TOU (New York): peak on weekdays only, holidays excluded, summer / winter prices.
const tariff = {
  tariff_version: 1,
  calendars: ['holidays-us'],
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        {
          label: 'Summer peak',
          when: {
            season: { from: '06-01', to: '09-30' },
            time: [['08:00', '24:00']],
            weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
            not_calendar: { 'holidays-us': 'holiday' },
          },
          price: 0.3,
        },
        {
          label: 'Winter peak',
          when: {
            time: [['08:00', '24:00']],
            weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
            not_calendar: { 'holidays-us': 'holiday' },
          },
          price: 0.25,
        },
      ],
      fallback: { label: 'Off-peak', price: 0.02 },
    },
  ],
};
const newYork = { timezone: 'America/New_York' };
// Independence Day 2026 falls on a Saturday and is observed on Friday 3 July
const calendars = createCalendarLookup({ 'holidays-us': { granularity: 'day', timezone: 'America/New_York' } }, [
  { calendar_key: 'holidays-us', date: '2026-07-03', value: 'holiday' },
]);

describe('tariffs: United States ConEd TOU', () => {
  it('should exclude weekends and public holidays from the peak', () => {
    const { costs } = price(
      tariff,
      newYork,
      [
        interval('2026-07-03T16:00:00Z', 1), // Friday 3 July noon, observed holiday
        interval('2026-07-04T16:00:00Z', 1), // Saturday
        interval('2026-07-06T16:00:00Z', 1), // Monday 6 July noon
        interval('2026-01-12T17:00:00Z', 1), // Monday 12 January noon EST
        interval('2026-01-12T08:00:00Z', 1), // Monday 03:00 EST
      ],
      { calendars },
    );
    const byStart = Object.fromEntries(costs.map((c) => [c.starts_at, c.label]));
    expect(byStart['2026-07-03T16:00:00.000Z']).to.equal('Off-peak');
    expect(byStart['2026-07-04T16:00:00.000Z']).to.equal('Off-peak');
    expect(byStart['2026-07-06T16:00:00.000Z']).to.equal('Summer peak');
    expect(byStart['2026-01-12T17:00:00.000Z']).to.equal('Winter peak');
    expect(byStart['2026-01-12T08:00:00.000Z']).to.equal('Off-peak');
  });
});
