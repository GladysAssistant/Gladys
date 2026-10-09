const { expect } = require('chai');
const { price, interval } = require('./helpers');

// United Kingdom, Economy 7: seven cheap night hours that follow GMT all year, not British Summer Time,
// so the contract timezone is Etc/GMT.
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [{ label: 'Night', when: { time: [['00:30', '07:30']] }, price: 0.09 }],
      fallback: { label: 'Day', price: 0.27 },
    },
    { key: 'standing', kind: 'fixed', amount: 0.6, per: 'day' },
  ],
};

describe('tariffs: United Kingdom Economy 7', () => {
  it('should keep the night window on GMT in summer', () => {
    const { costs } = price(tariff, { timezone: 'Etc/GMT' }, [
      interval('2026-07-06T06:00:00Z', 1), // 07:00 BST, still 06:00 GMT: night
      interval('2026-07-06T07:30:00Z', 1), // day
      interval('2026-07-06T00:00:00Z', 1), // 00:00 GMT: day (night starts at 00:30)
    ]);
    expect(costs.map((c) => c.label)).to.deep.equal(['Day', 'Night', 'Day']);
    expect(costs[0].components.standing).to.be.closeTo(0.6 * (30 / 1440), 1e-6);
  });
});
