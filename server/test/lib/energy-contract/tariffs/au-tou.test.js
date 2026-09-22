const { expect } = require('chai');
const { price, interval } = require('./helpers');

// Australia, time-of-use tariff: peak / shoulder / off-peak on weekdays, off-peak all weekend, daily supply charge.
const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: 'Peak', when: { weekdays, time: [['14:00', '20:00']] }, price: 0.55 },
        {
          label: 'Shoulder',
          when: {
            weekdays,
            time: [
              ['07:00', '14:00'],
              ['20:00', '22:00'],
            ],
          },
          price: 0.28,
        },
      ],
      fallback: { label: 'Off-peak', price: 0.2 },
    },
    { key: 'supply', kind: 'fixed', amount: 1.1, per: 'day' },
  ],
};
const sydney = { timezone: 'Australia/Sydney' };

describe('tariffs: Australia time-of-use', () => {
  it('should price the windows in local time with a daily supply charge', () => {
    const { costs } = price(tariff, sydney, [
      interval('2026-01-11T21:00:00Z', 1), // Monday 12 January 08:00 AEDT: shoulder
      interval('2026-01-12T04:00:00Z', 1), // 15:00: peak
      interval('2026-01-17T04:00:00Z', 1), // Saturday 15:00: off-peak
    ]);
    expect(costs.map((c) => c.label)).to.deep.equal(['Shoulder', 'Peak', 'Off-peak']);
    expect(costs[0].components.supply).to.be.closeTo(1.1 * (30 / 1440), 1e-6);
  });
});
