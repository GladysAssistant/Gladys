const { expect } = require('chai');
const { price, interval } = require('./helpers');

// South Korea, KEPCO residential: monthly progressive tiers whose thresholds move up in July and August.
const summer = { from: '07-01', to: '08-31' };
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        {
          label: 'Summer tier 1',
          when: { season: summer, tier: { cumulative: 'month', from_kwh: 0, to_kwh: 300 } },
          price: 120,
        },
        {
          label: 'Summer tier 2',
          when: { season: summer, tier: { cumulative: 'month', from_kwh: 300, to_kwh: 450 } },
          price: 214.6,
        },
        { label: 'Summer tier 3', when: { season: summer }, price: 307.3 },
        { label: 'Tier 1', when: { tier: { cumulative: 'month', from_kwh: 0, to_kwh: 200 } }, price: 120 },
        { label: 'Tier 2', when: { tier: { cumulative: 'month', from_kwh: 200, to_kwh: 400 } }, price: 214.6 },
      ],
      fallback: { label: 'Tier 3', price: 307.3 },
    },
  ],
};
const seoul = { timezone: 'Asia/Seoul' };

describe('tariffs: South Korea KEPCO residential', () => {
  it('should use the wider summer tiers in July', () => {
    const july = price(tariff, seoul, [interval('2026-07-15T03:00:00Z', 2)], { cumulative_before: { month: 299 } });
    expect(july.costs[0].components.energy).to.be.closeTo(120 + 214.6, 1e-9);
    const january = price(tariff, seoul, [interval('2026-01-15T03:00:00Z', 2)], { cumulative_before: { month: 299 } });
    expect(january.costs[0].components.energy).to.be.closeTo(2 * 214.6, 1e-9);
    expect(january.costs[0].label).to.equal('Tier 2');
    const heavy = price(tariff, seoul, [interval('2026-07-15T03:00:00Z', 2)], { cumulative_before: { month: 1000 } });
    expect(heavy.costs[0].label).to.equal('Summer tier 3');
  });
});
