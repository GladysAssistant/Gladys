const { expect } = require('chai');
const { price, interval } = require('./helpers');

// Belgium (Flanders), capacity tariff: a kWh price plus a monthly component on the peak power.
const tariff = {
  tariff_version: 1,
  components: [
    { key: 'energy', kind: 'consumption', fallback: { price: 0.3 } },
    { key: 'capacity', kind: 'demand', price: 4.5, per: 'month', aggregation: 'max' },
  ],
};
const brussels = { timezone: 'Europe/Brussels' };
const intervals = [
  interval('2026-01-12T11:00:00Z', 1.25, { max_power_kw: 2.5 }),
  interval('2026-01-12T11:30:00Z', 3, { max_power_kw: 6 }),
];

describe('tariffs: Belgium capacity tariff', () => {
  it('should charge the monthly peak once the period is closed', () => {
    const open = price(tariff, brussels, intervals);
    expect(open.costs.map((c) => c.components.capacity)).to.deep.equal([0, 0]);
    const closed = price(tariff, brussels, intervals, { closed_period: true });
    // 4.5 per kW on the 6 kW peak = 27, half per 30-minute interval
    expect(closed.costs.map((c) => c.components.capacity)).to.deep.equal([13.5, 13.5]);
    expect(closed.costs[0].cost).to.be.closeTo(0.375 + 13.5, 1e-9);
  });
});
