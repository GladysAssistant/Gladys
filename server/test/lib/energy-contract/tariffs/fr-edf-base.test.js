const { expect } = require('chai');
const { price, interval } = require('./helpers');

// France, EDF Base: single price + monthly subscription (docs/specs/energy-contracts.md, section 6).
const tariff = {
  tariff_version: 1,
  components: [
    { key: 'energy', kind: 'consumption', fallback: { label: 'Base', price: 0.2516 } },
    { key: 'subscription', kind: 'fixed', amount: 17.11, per: 'month' },
  ],
};
const paris = { timezone: 'Europe/Paris' };

describe('tariffs: France EDF Base', () => {
  it('should price 30-minute and daily consumption features alike', () => {
    const { costs, warnings } = price(tariff, paris, [
      interval('2026-01-12T11:00:00Z', 1),
      interval('2026-01-13T23:00:00Z', 10, { duration_minutes: 1440 }),
    ]);
    expect(warnings).to.deep.equal([]);
    expect(costs[0].components.energy).to.be.closeTo(0.2516, 1e-9);
    expect(costs[0].components.subscription).to.be.closeTo(17.11 * (30 / 44640), 1e-6);
    expect(costs[1].components.energy).to.be.closeTo(2.516, 1e-9);
    expect(costs[1].components.subscription).to.be.closeTo(17.11 * (1440 / 44640), 1e-6);
  });
});
