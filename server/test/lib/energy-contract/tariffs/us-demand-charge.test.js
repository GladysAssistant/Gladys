const { expect } = require('chai');
const { price, interval } = require('./helpers');

// United States, residential rate with a demand charge (Arizona SRP style): a kWh price plus
// dollars per kW of the highest 30-minute demand of the billing period, in summer only.
const tariff = {
  tariff_version: 1,
  components: [
    { key: 'energy', kind: 'consumption', fallback: { price: 0.08 } },
    {
      key: 'demand',
      kind: 'demand',
      price: 8.03,
      per: 'billing_period',
      when: { season: { from: '05-01', to: '10-31' } },
    },
  ],
};
const phoenix = { timezone: 'America/Phoenix', billing_period_start_day: 15 };

describe('tariffs: United States demand charge', () => {
  it('should charge the billing period peak and skip the winter periods', () => {
    const { costs } = price(
      tariff,
      phoenix,
      [
        interval('2026-07-16T20:00:00Z', 1.5, { max_power_kw: 3 }),
        interval('2026-07-20T22:00:00Z', 3, { max_power_kw: 7.5 }),
        interval('2026-08-10T22:00:00Z', 2, { max_power_kw: 5 }),
        interval('2026-01-20T22:00:00Z', 2, { max_power_kw: 9 }),
      ],
      { closed_period: true },
    );
    const summerCharges = costs.filter(
      (c) => c.starts_at.startsWith('2026-0[78]'.replace('[78]', '7')) || c.starts_at.startsWith('2026-08'),
    );
    // the three summer intervals belong to the period starting 15 July: 8.03 × 7.5 = 60.225, a third each
    summerCharges.forEach((c) => expect(c.components.demand).to.be.closeTo(60.225 / 3, 1e-6));
    const winter = costs.find((c) => c.starts_at.startsWith('2026-01'));
    expect(winter.components.demand).to.equal(0);
    expect(winter.cost).to.be.closeTo(0.16, 1e-9);
  });
});
