const { expect } = require('chai');
const { price, interval } = require('./helpers');

// France, peak / off-peak: the off-peak slots are specific to each meter, so they are a template input.
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [{ label: 'Off-peak', when: { time: '{{input:off_peak_slots}}' }, price: 0.2068 }],
      fallback: { label: 'Peak', price: 0.27 },
    },
    { key: 'subscription', kind: 'fixed', amount: '{{input:subscription}}', per: 'month' },
  ],
};
const paris = { timezone: 'Europe/Paris' };

describe('tariffs: France peak / off-peak', () => {
  it('should apply the off-peak price on the configured slots, midnight crossing included', () => {
    const { costs } = price(
      tariff,
      paris,
      [
        interval('2026-01-12T22:00:00Z', 1), // 23:00 Paris
        interval('2026-01-13T04:30:00Z', 1), // 05:30
        interval('2026-01-13T05:00:00Z', 1), // 06:00: peak starts
        interval('2026-01-13T11:00:00Z', 1), // noon
        interval('2026-01-13T13:00:00Z', 1), // 14:00, the second off-peak slot
      ],
      {
        inputs: {
          off_peak_slots: [
            ['22:00', '06:00'],
            ['14:00', '16:00'],
          ],
          subscription: 19.16,
        },
      },
    );
    expect(costs.map((c) => c.label)).to.deep.equal(['Off-peak', 'Off-peak', 'Peak', 'Peak', 'Off-peak']);
    expect(costs[0].components.energy).to.be.closeTo(0.2068, 1e-9);
    expect(costs[2].components.energy).to.be.closeTo(0.27, 1e-9);
    expect(costs[0].components.subscription).to.be.closeTo(19.16 * (30 / 44640), 1e-6);
  });
});
