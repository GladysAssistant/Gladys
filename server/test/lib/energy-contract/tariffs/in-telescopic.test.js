const { expect } = require('chai');
const { price, interval } = require('./helpers');

// India, telescopic residential tariff: monthly progressive slabs.
const tariff = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: '0-50', when: { tier: { cumulative: 'month', from_kwh: 0, to_kwh: 50 } }, price: 4.75 },
        { label: '50-100', when: { tier: { cumulative: 'month', from_kwh: 50, to_kwh: 100 } }, price: 6.5 },
        { label: '100-200', when: { tier: { cumulative: 'month', from_kwh: 100, to_kwh: 200 } }, price: 7.35 },
      ],
      fallback: { label: 'Above 200', price: 8.05 },
    },
  ],
};

describe('tariffs: India telescopic tariff', () => {
  it('should walk through several slabs in one interval', () => {
    const { costs } = price(tariff, { timezone: 'Asia/Kolkata' }, [interval('2026-01-12T06:00:00Z', 60)], {
      cumulative_before: { month: 45 },
    });
    // 5 kWh in the first slab, 50 in the second, 5 in the third
    expect(costs[0].components.energy).to.be.closeTo(5 * 4.75 + 50 * 6.5 + 5 * 7.35, 1e-9);
    expect(costs[0].label).to.equal('100-200');
  });
});
