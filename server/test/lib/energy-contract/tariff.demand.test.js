const { expect } = require('chai');
const { aggregatePeakPower, computeDemandCharges } = require('../../../lib/energy-contract/tariff.demand');
const { compileTariff } = require('../../../lib/energy-contract/tariff.compile');
const { prepareIntervals } = require('../../../lib/energy-contract/tariff.priceIntervals');

const at = (day, hour, power) => ({ starts_at: Date.UTC(2026, 0, day, hour), kwh: power / 2, max_power_kw: power });

describe('energy-contract tariff.demand', () => {
  it('should aggregate the maximum peak', () => {
    const prepared = prepareIntervals([at(12, 10, 2), at(12, 11, 5), at(13, 10, 3)], 'UTC', 1);
    expect(aggregatePeakPower('max', prepared)).to.equal(5);
  });
  it('should average the three highest daily peaks, or fewer days when the period is short', () => {
    const fiveDays = prepareIntervals(
      [at(12, 10, 2), at(12, 11, 3), at(13, 10, 5), at(14, 10, 4), at(15, 10, 1), at(16, 10, 6)],
      'UTC',
      1,
    );
    expect(aggregatePeakPower('top3_average', fiveDays)).to.equal((6 + 5 + 4) / 3);
    const twoDays = prepareIntervals([at(12, 10, 2), at(13, 10, 4)], 'UTC', 1);
    expect(aggregatePeakPower('top3_average', twoDays)).to.equal(3);
  });
  it('should charge each period on its own peak, spread pro rata of the durations', () => {
    const compiled = compileTariff({
      tariff_version: 1,
      components: [
        { key: 'energy', kind: 'consumption', fallback: { price: 0 } },
        { key: 'monthly', kind: 'demand', price: 10, per: 'month' },
        { key: 'billing', kind: 'demand', price: 1, per: 'billing_period', aggregation: 'top3_average' },
      ],
    });
    const prepared = prepareIntervals(
      [
        at(12, 10, 2),
        { starts_at: Date.UTC(2026, 0, 12, 11), kwh: 4, max_power_kw: 4, duration_minutes: 60 },
        { starts_at: Date.UTC(2026, 1, 3, 10), kwh: 1, max_power_kw: 3 },
      ],
      'UTC',
      15,
    );
    const charges = computeDemandCharges(compiled, prepared);
    // January: 10 per kW on a 4 kW peak = 40, spread 30 / 90 and 60 / 90
    expect(charges[0].monthly).to.be.closeTo(40 / 3, 1e-9);
    expect(charges[1].monthly).to.be.closeTo(80 / 3, 1e-9);
    // February: its own 3 kW peak
    expect(charges[2].monthly).to.equal(30);
    // billing periods start on the 15th: 12 January belongs to the 15 December period, 3 February to the 15 January one
    expect(charges[0].billing).to.be.closeTo(4 / 3, 1e-9);
    expect(charges[1].billing).to.be.closeTo(8 / 3, 1e-9);
    expect(charges[2].billing).to.equal(3);
  });
  it('should skip the periods whose conditions do not hold', () => {
    const compiled = compileTariff({
      tariff_version: 1,
      components: [
        { key: 'energy', kind: 'consumption', fallback: { price: 0 } },
        { key: 'summer', kind: 'demand', price: 10, per: 'month', when: { months: [6, 7, 8] } },
      ],
    });
    const prepared = prepareIntervals([at(12, 10, 2)], 'UTC', 1);
    expect(computeDemandCharges(compiled, prepared)).to.deep.equal([{}]);
  });
});
