const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// France, spot-price offers: hourly market price × coefficient + margin, from a 30-minute calendar
// published by an integration.
const tariff = {
  tariff_version: 1,
  calendars: ['spot-fr'],
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        {
          label: 'Spot',
          when: { time: [['00:00', '24:00']] },
          price_from_calendar: 'spot-fr',
          multiplier: 1.2,
          offset: 0.03,
        },
      ],
      fallback: { label: 'Regulated', price: 0.25 },
    },
  ],
};

describe('tariffs: France spot offer', () => {
  it('should apply the coefficient and margin to the published price and fall back when it is missing', () => {
    const calendars = createCalendarLookup({ 'spot-fr': { granularity: 'thirty_minutes' } }, [
      { calendar_key: 'spot-fr', starts_at: '2026-01-12T11:00:00Z', value: 0.1 },
      { calendar_key: 'spot-fr', starts_at: '2026-01-12T11:30:00Z', value: 0 },
    ]);
    const { costs, warnings } = price(
      tariff,
      { timezone: 'Europe/Paris' },
      [interval('2026-01-12T11:00:00Z', 2), interval('2026-01-12T11:30:00Z', 2), interval('2026-01-12T12:00:00Z', 2)],
      { calendars },
    );
    expect(costs[0].components.energy).to.be.closeTo(2 * (0.1 * 1.2 + 0.03), 1e-9);
    expect(costs[1].components.energy).to.be.closeTo(2 * 0.03, 1e-9);
    expect(costs[2].components.energy).to.be.closeTo(0.5, 1e-9);
    expect(warnings).to.have.lengthOf(1);
    expect(warnings[0]).to.include({ calendar_key: 'spot-fr', reason: 'calendar_missing' });
  });
});
