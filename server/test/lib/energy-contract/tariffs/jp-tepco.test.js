const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// Japan, TEPCO tiered plan (従量電灯 B): three monthly progressive tiers, a base fee that depends on the
// contracted amperage (a template input), a fuel cost adjustment published monthly (a calendar, negative
// some months) and the renewable energy levy.
const tariff = {
  tariff_version: 1,
  calendars: ['tepco-fuel-adjustment'],
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: 'Tier 1', when: { tier: { cumulative: 'billing_period', from_kwh: 0, to_kwh: 120 } }, price: 29.8 },
        { label: 'Tier 2', when: { tier: { cumulative: 'billing_period', from_kwh: 120, to_kwh: 300 } }, price: 36.4 },
      ],
      fallback: { label: 'Tier 3', price: 40.49 },
    },
    { key: 'fuel_adjustment', kind: 'consumption', fallback: { price_from_calendar: 'tepco-fuel-adjustment' } },
    { key: 'renewable_levy', kind: 'consumption', fallback: { price: 3.49 } },
    { key: 'base_fee', kind: 'fixed', amount: '{{input:base_fee}}', per: 'month' },
  ],
};
const tokyo = { timezone: 'Asia/Tokyo', billing_period_start_day: 1 };
const calendars = createCalendarLookup({ 'tepco-fuel-adjustment': { granularity: 'day', timezone: 'Asia/Tokyo' } }, [
  { calendar_key: 'tepco-fuel-adjustment', date: '2026-07-15', value: -3 },
]);

describe('tariffs: Japan TEPCO tiered plan', () => {
  it('should stack tiers, a calendar surcharge, a levy and an input-driven base fee', () => {
    const { costs } = price(tariff, tokyo, [interval('2026-07-15T03:00:00Z', 1)], {
      inputs: { base_fee: 1247.2 },
      calendars,
      cumulative_before: { billing_period: 119.5 },
    });
    const [cost] = costs;
    expect(cost.components.energy).to.be.closeTo(0.5 * 29.8 + 0.5 * 36.4, 1e-9);
    expect(cost.components.fuel_adjustment).to.be.closeTo(-3, 1e-9);
    expect(cost.components.renewable_levy).to.be.closeTo(3.49, 1e-9);
    expect(cost.components.base_fee).to.be.closeTo(1247.2 * (30 / 44640), 1e-6);
    expect(cost.cost).to.be.closeTo(33.1 - 3 + 3.49 + 1247.2 * (30 / 44640), 1e-6);
  });
});
