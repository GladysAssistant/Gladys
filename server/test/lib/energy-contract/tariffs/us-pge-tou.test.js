const { expect } = require('chai');
const { price, interval } = require('./helpers');

// United States, PG&E E-TOU-C (California): 4 pm - 9 pm peak, summer (June - September) / winter prices,
// and a baseline credit on the first kWh of each billing period (a tier).
const summer = { from: '06-01', to: '09-30' };
const peak = [['16:00', '21:00']];
const baseline = { cumulative: 'billing_period', from_kwh: 0, to_kwh: 300 };
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: 'Summer peak (baseline)', when: { season: summer, time: peak, tier: baseline }, price: 0.37 },
        { label: 'Summer off-peak (baseline)', when: { season: summer, tier: baseline }, price: 0.27 },
        { label: 'Summer peak', when: { season: summer, time: peak }, price: 0.45 },
        { label: 'Summer off-peak', when: { season: summer }, price: 0.35 },
        { label: 'Winter peak (baseline)', when: { time: peak, tier: baseline }, price: 0.27 },
        { label: 'Winter off-peak (baseline)', when: { tier: baseline }, price: 0.22 },
        { label: 'Winter peak', when: { time: peak }, price: 0.35 },
      ],
      fallback: { label: 'Winter off-peak', price: 0.3 },
    },
  ],
};
const california = { timezone: 'America/Los_Angeles', billing_period_start_day: 1 };

describe('tariffs: United States PG&E E-TOU-C', () => {
  it('should combine season, peak window and baseline tier, splitting an interval that crosses the baseline', () => {
    const { costs } = price(tariff, california, [interval('2026-07-07T00:00:00Z', 1)], {
      // Monday 6 July, 17:00 PDT, 299.5 kWh already used in the period
      cumulative_before: { billing_period: 299.5 },
    });
    expect(costs[0].components.energy).to.be.closeTo(0.5 * 0.37 + 0.5 * 0.45, 1e-9);
    expect(costs[0].label).to.equal('Summer peak');
  });
  it('should price winter intervals with the winter rules', () => {
    const { costs } = price(tariff, california, [
      interval('2026-01-13T01:00:00Z', 1), // Monday 12 January, 17:00 PST
      interval('2026-01-13T06:00:00Z', 1), // 22:00 PST
    ]);
    expect(costs.map((c) => c.label)).to.deep.equal(['Winter peak (baseline)', 'Winter off-peak (baseline)']);
    const beyond = price(tariff, california, [interval('2026-01-13T06:00:00Z', 1)], {
      cumulative_before: { billing_period: 500 },
    });
    expect(beyond.costs[0].label).to.equal('Winter off-peak');
    expect(beyond.costs[0].components.energy).to.be.closeTo(0.3, 1e-9);
  });
});
