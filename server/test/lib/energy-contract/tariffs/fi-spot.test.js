const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// Finland, spot contract: the day-ahead price changes every 15 minutes (the Nordic market
// moved to 15-minute products in October 2025), published the day before by an integration in
// a 15-minute calendar; the supplier adds a margin, the electricity tax is a separate per-kWh
// component, VAT applies to both, and a monthly fee.
const tariff = {
  tariff_version: 1,
  calendars: ['spot-fi'],
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [{ label: 'Spot', price_from_calendar: 'spot-fi', offset: 0.005 }],
      fallback: { label: 'Backup', price: 0.12 },
    },
    { key: 'electricity_tax', kind: 'consumption', fallback: { label: 'Electricity tax', price: 0.0224 } },
    { key: 'vat', kind: 'tax', rate: 25.5, applies_to: ['energy', 'electricity_tax'] },
    { key: 'subscription', kind: 'fixed', amount: 3.99, per: 'month' },
  ],
};
const contract = { timezone: 'Europe/Helsinki' };
const definitions = { 'spot-fi': { granularity: 'fifteen_minutes', timezone: 'Europe/Helsinki' } };
const quarters = (prices) =>
  Object.keys(prices).map((startsAt) => ({ calendar_key: 'spot-fi', starts_at: startsAt, value: prices[startsAt] }));

describe('tariffs: Finland spot (15-minute prices)', () => {
  it('should price each half of a 30-minute interval at its own quarter price', () => {
    const calendars = createCalendarLookup(
      definitions,
      quarters({
        '2026-01-12T10:00:00Z': 0.04,
        '2026-01-12T10:15:00Z': 0.1,
        // a negative spot price, common on windy nights
        '2026-01-12T10:30:00Z': -0.002,
        '2026-01-12T10:45:00Z': 0.006,
      }),
    );
    const { costs, warnings } = price(
      tariff,
      contract,
      [interval('2026-01-12T10:00:00Z', 2), interval('2026-01-12T10:30:00Z', 1)],
      { calendars, exclude_kinds: ['fixed'] },
    );
    expect(warnings).to.deep.equal([]);
    // 1 kWh at each quarter: the mean of the two quarter prices, plus the margin
    expect(costs[0].components.energy).to.be.closeTo(1 * (0.04 + 0.005) + 1 * (0.1 + 0.005), 1e-9);
    expect(costs[0].components.electricity_tax).to.be.closeTo(2 * 0.0224, 1e-9);
    expect(costs[0].components.vat).to.be.closeTo((0.15 + 2 * 0.0224) * 0.255, 1e-6);
    expect(costs[0].components).to.not.have.property('subscription');
    // the label is the energy price's: the tax component declared after it never hides it
    expect(costs[0].label).to.equal('Spot');
    expect(costs[1].components.energy).to.be.closeTo(0.5 * (-0.002 + 0.005) + 0.5 * (0.006 + 0.005), 1e-9);
    // the stored cost stays one amount per 30-minute interval
    expect(costs.map((c) => c.starts_at)).to.deep.equal(['2026-01-12T10:00:00.000Z', '2026-01-12T10:30:00.000Z']);
  });

  it('should price a missing quarter with the fallback and a warning, for that half only', () => {
    const calendars = createCalendarLookup(definitions, quarters({ '2026-01-12T11:00:00Z': 0.05 }));
    const { costs, warnings } = price(tariff, contract, [interval('2026-01-12T11:00:00Z', 2)], {
      calendars,
      exclude_kinds: ['fixed'],
    });
    expect(costs[0].components.energy).to.be.closeTo(1 * (0.05 + 0.005) + 1 * 0.12, 1e-9);
    expect(costs[0].label).to.equal('Backup');
    expect(warnings).to.deep.equal([
      {
        starts_at: '2026-01-12T11:15:00.000Z',
        component_key: 'energy',
        calendar_key: 'spot-fi',
        reason: 'calendar_missing',
      },
    ]);
  });

  it('should keep the quarters of the repeated hour apart on the autumn clock change', () => {
    // 25 October 2026: Helsinki goes back from 04:00 EEST to 03:00 EET at 01:00 UTC, the local
    // 03:00 - 04:00 hour happens twice; the quarters are keyed by their UTC instant
    const calendars = createCalendarLookup(
      definitions,
      quarters({
        '2026-10-25T00:00:00Z': 0.01,
        '2026-10-25T00:15:00Z': 0.02,
        '2026-10-25T00:30:00Z': 0.03,
        '2026-10-25T00:45:00Z': 0.04,
        '2026-10-25T01:00:00Z': 0.05,
        '2026-10-25T01:15:00Z': 0.06,
        '2026-10-25T01:30:00Z': 0.07,
        '2026-10-25T01:45:00Z': 0.08,
      }),
    );
    const { costs, warnings } = price(
      tariff,
      contract,
      ['00:00', '00:30', '01:00', '01:30'].map((time) => interval(`2026-10-25T${time}:00Z`, 2)),
      { calendars, exclude_kinds: ['fixed'] },
    );
    expect(warnings).to.deep.equal([]);
    const energy = costs.map((c) => c.components.energy);
    [0.01 + 0.02, 0.03 + 0.04, 0.05 + 0.06, 0.07 + 0.08].forEach((sum, index) => {
      expect(energy[index]).to.be.closeTo(sum + 2 * 0.005, 1e-9);
    });
  });
});
