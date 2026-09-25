const { expect } = require('chai');
const { price, interval } = require('./helpers');

// France, weekend off-peak offers: off-peak on weekday nights and all weekend long.
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: 'Weekend', when: { weekdays: ['sat', 'sun'] }, price: 0.16 },
        { label: 'Night', when: { time: [['22:00', '06:00']] }, price: 0.16 },
      ],
      fallback: { label: 'Peak', price: 0.25 },
    },
  ],
};

describe('tariffs: France weekend off-peak', () => {
  it('should treat the whole weekend as off-peak', () => {
    const { costs } = price(tariff, { timezone: 'Europe/Paris' }, [
      interval('2026-01-17T11:00:00Z', 1), // Saturday noon
      interval('2026-01-18T22:30:00Z', 1), // Sunday 23:30
      interval('2026-01-19T11:00:00Z', 1), // Monday noon
      interval('2026-01-19T22:30:00Z', 1), // Monday 23:30
      interval('2026-01-16T22:30:00Z', 1), // Friday 23:30 (Paris), Friday night
    ]);
    expect(costs.map((c) => c.label)).to.deep.equal(['Night', 'Weekend', 'Weekend', 'Peak', 'Night']);
  });
});
