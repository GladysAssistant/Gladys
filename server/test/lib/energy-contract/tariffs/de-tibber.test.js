const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// Germany, Tibber / aWATTar: hourly spot price plus fixed grid fees and levies per kWh, then VAT.
const tariff = {
  tariff_version: 1,
  calendars: ['spot-de'],
  components: [
    { key: 'energy', kind: 'consumption', fallback: { label: 'Spot', price_from_calendar: 'spot-de', offset: 0.18 } },
    { key: 'vat', kind: 'tax', rate: 19, applies_to: ['energy'] },
  ],
};
const calendars = createCalendarLookup({ 'spot-de': { granularity: 'thirty_minutes' } }, [
  { calendar_key: 'spot-de', starts_at: '2026-01-12T11:00:00Z', value: 0.08 },
]);

describe('tariffs: Germany spot with fees and VAT', () => {
  it('should add the fees to the spot price and tax the result', () => {
    const { costs } = price(tariff, { timezone: 'Europe/Berlin' }, [interval('2026-01-12T11:00:00Z', 1)], {
      calendars,
    });
    expect(costs[0].components.energy).to.be.closeTo(0.26, 1e-9);
    expect(costs[0].components.vat).to.be.closeTo(0.0494, 1e-9);
    expect(costs[0].cost).to.be.closeTo(0.3094, 1e-9);
  });
});
