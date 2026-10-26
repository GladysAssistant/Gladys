const { expect } = require('chai');
const { price, interval } = require('./helpers');

// Canada, Hydro-Québec Rate D: the first 40 kWh × the days of the consumption period at the
// low price, the rest at the high price, and a daily access fee. The threshold is judged on
// the total of the billing period (a 31-day period allows 1,240 kWh), not day by day.
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        {
          label: 'First 40 kWh per day',
          when: { tier: { cumulative: 'billing_period', from_kwh_per_day: 0, to_kwh_per_day: 40 } },
          price: 0.06905,
        },
      ],
      fallback: { label: 'Remaining kWh', price: 0.10652 },
    },
    { key: 'access', kind: 'fixed', amount: 0.44, per: 'day' },
  ],
};
const quebec = { timezone: 'America/Toronto', billing_period_start_day: 1 };
// one daily interval (local midnight, 05:00 UTC in winter) per day of the month
const days = (year, month, count, kwhOfDay) =>
  Array.from({ length: count }, (_, i) =>
    interval(new Date(Date.UTC(year, month - 1, i + 1, 5)).toISOString(), kwhOfDay(i + 1), { duration_minutes: 1440 }),
  );

describe('tariffs: Canada Hydro-Québec Rate D', () => {
  it('should judge the allowance on the total of the period, not day by day', () => {
    // January 2027: 15 days at 60 kWh then 16 days at 20 kWh = 1,220 kWh, under the 1,240 kWh
    // of the period, so every kWh is at the low price although 15 days exceeded 40 kWh
    const { costs, cumulative } = price(
      tariff,
      quebec,
      days(2027, 1, 31, (day) => (day <= 15 ? 60 : 20)),
    );
    expect(costs).to.have.lengthOf(31);
    expect(costs.every((c) => c.label === 'First 40 kWh per day')).to.equal(true);
    const energy = costs.reduce((sum, c) => sum + c.components.energy, 0);
    expect(energy).to.be.closeTo(1220 * 0.06905, 1e-6);
    expect(costs[0].components.access).to.be.closeTo(0.44, 1e-6);
    expect(cumulative.billing_period).to.equal(1220);
  });
  it('should price the kWh beyond 40 × days at the high price', () => {
    // 31 days at 50 kWh = 1,550 kWh: 1,240 at the low price, 310 at the high price
    const { costs } = price(
      tariff,
      quebec,
      days(2027, 1, 31, () => 50),
    );
    // the 25th day straddles the threshold: 40 kWh left in the allowance, 10 beyond
    expect(costs[24].components.energy).to.be.closeTo(40 * 0.06905 + 10 * 0.10652, 1e-6);
    expect(costs[24].label).to.equal('Remaining kWh');
    expect(costs[25].components.energy).to.be.closeTo(50 * 0.10652, 1e-6);
    const energy = costs.reduce((sum, c) => sum + c.components.energy, 0);
    expect(energy).to.be.closeTo(1240 * 0.06905 + 310 * 0.10652, 1e-6);
  });
  it('should count the days of the period covered by the contract', () => {
    // a contract starting on 15 January: 17 days of January, 680 kWh in the allowance
    const started = { ...quebec, valid_from: '2027-01-15' };
    const { costs } = price(
      tariff,
      started,
      days(2027, 1, 31, () => 50).filter((i) => new Date(i.starts_at).getUTCDate() >= 15),
    );
    expect(costs).to.have.lengthOf(17);
    const energy = costs.reduce((sum, c) => sum + c.components.energy, 0);
    expect(energy).to.be.closeTo(680 * 0.06905 + 170 * 0.10652, 1e-6);
  });
  it('should continue the allowance from the accumulation the caller passes', () => {
    const { costs } = price(tariff, quebec, [interval('2027-01-20T20:00:00Z', 20)], {
      cumulative_before: { billing_period: 1230 },
    });
    expect(costs[0].components.energy).to.be.closeTo(10 * 0.06905 + 10 * 0.10652, 1e-9);
    expect(costs[0].components.access).to.be.closeTo(0.44 * (30 / 1440), 1e-6);
  });
});
