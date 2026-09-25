const { expect } = require('chai');
const { price, interval } = require('./helpers');

// Canada, Hydro-Québec Rate D: two price tiers per day (the first 40 kWh, then the rest) and a daily fee.
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: 'First 40 kWh', when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 40 } }, price: 0.06905 },
      ],
      fallback: { label: 'Remaining kWh', price: 0.10652 },
    },
    { key: 'access', kind: 'fixed', amount: 0.44, per: 'day' },
  ],
};
const quebec = { timezone: 'America/Toronto' };

describe('tariffs: Canada Hydro-Québec Rate D', () => {
  it('should price the daily tiers and restart them every day', () => {
    const { costs } = price(
      tariff,
      quebec,
      [
        interval('2026-01-12T20:00:00Z', 2), // 15:00 Toronto, 39 kWh already used today
        interval('2026-01-13T05:30:00Z', 1), // 00:30 on the 13th: new day
      ],
      { cumulative_before: { day: 39 } },
    );
    expect(costs[0].components.energy).to.be.closeTo(1 * 0.06905 + 1 * 0.10652, 1e-9);
    expect(costs[0].label).to.equal('Remaining kWh');
    expect(costs[0].components.access).to.be.closeTo(0.44 * (30 / 1440), 1e-6);
    expect(costs[1].components.energy).to.be.closeTo(0.06905, 1e-9);
    expect(costs[1].label).to.equal('First 40 kWh');
  });
});
