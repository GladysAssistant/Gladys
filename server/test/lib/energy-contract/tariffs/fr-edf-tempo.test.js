const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// France, EDF Tempo: six prices, the day colour runs from 06:00 to 06:00 Paris time.
const tariff = {
  tariff_version: 1,
  calendars: ['tempo'],
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: 'Red peak', when: { calendar: { tempo: 'red' }, time: [['06:00', '22:00']] }, price: 0.7562 },
        { label: 'Red off-peak', when: { calendar: { tempo: 'red' } }, price: 0.1568 },
        { label: 'White peak', when: { calendar: { tempo: 'white' }, time: [['06:00', '22:00']] }, price: 0.1894 },
        { label: 'White off-peak', when: { calendar: { tempo: 'white' } }, price: 0.1486 },
        { label: 'Blue peak', when: { calendar: { tempo: 'blue' }, time: [['06:00', '22:00']] }, price: 0.1609 },
      ],
      fallback: { label: 'Blue off-peak', price: 0.1296 },
    },
    { key: 'subscription', kind: 'fixed', amount: 17.11, per: 'month' },
  ],
};
const paris = { timezone: 'Europe/Paris' };
const calendars = createCalendarLookup(
  { tempo: { granularity: 'day', timezone: 'Europe/Paris', day_starts_at: '06:00' } },
  [
    { calendar_key: 'tempo', date: '2026-01-12', value: 'red' },
    { calendar_key: 'tempo', date: '2026-01-13', value: 'white' },
  ],
);

describe('tariffs: France EDF Tempo', () => {
  it('should price by colour and time slot, the colour of the day lasting until 06:00', () => {
    const { costs, warnings } = price(
      tariff,
      paris,
      [
        interval('2026-01-12T11:00:00Z', 1), // 12:00, red peak
        interval('2026-01-12T22:00:00Z', 1), // 23:00, red off-peak
        interval('2026-01-13T02:00:00Z', 1), // 03:00 on the 13th: still red
        interval('2026-01-13T11:00:00Z', 1), // white peak
        interval('2026-01-14T11:00:00Z', 1), // no colour known: fallback
      ],
      { calendars },
    );
    expect(costs.map((c) => c.label)).to.deep.equal([
      'Red peak',
      'Red off-peak',
      'Red off-peak',
      'White peak',
      'Blue off-peak',
    ]);
    expect(costs.map((c) => c.components.energy)).to.deep.equal([0.7562, 0.1568, 0.1568, 0.1894, 0.1296]);
    // an unknown colour is not an error, the fallback applies without a warning (only calendar prices warn)
    expect(warnings).to.deep.equal([]);
  });
});
