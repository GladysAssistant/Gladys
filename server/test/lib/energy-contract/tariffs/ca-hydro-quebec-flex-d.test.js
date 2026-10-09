const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// Canada, Hydro-Québec Flex D: Rate D with winter critical peak events (1 December - 31 March).
// Three categories of energy in winter, judged per billing period: the first 40 kWh × days
// outside the peak events at the low price, the rest outside the events at the high price,
// and the energy during the events at the peak price. The peak kWh never feed the
// allowance: the tier counts the off-peak energy only (`counts_when`).
const winter = { season: { from: '12-01', to: '03-31' } };
const offPeak = { not_calendar: { 'hq-critical-peaks': 'critical-peak' } };
const tariff = {
  tariff_version: 1,
  calendars: ['hq-critical-peaks'],
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: 'Critical peak', when: { calendar: { 'hq-critical-peaks': 'critical-peak' } }, price: 0.46463 },
        {
          label: 'Winter first 40 kWh per day',
          when: {
            ...winter,
            tier: { cumulative: 'billing_period', from_kwh_per_day: 0, to_kwh_per_day: 40, counts_when: offPeak },
          },
          price: 0.04886,
        },
        {
          label: 'Winter remaining kWh',
          when: { ...winter, tier: { cumulative: 'billing_period', from_kwh_per_day: 40, counts_when: offPeak } },
          price: 0.09103,
        },
        {
          label: 'Summer first 40 kWh per day',
          when: { tier: { cumulative: 'billing_period', from_kwh_per_day: 0, to_kwh_per_day: 40 } },
          price: 0.07065,
        },
      ],
      fallback: { label: 'Summer remaining kWh', price: 0.11142 },
    },
    { key: 'access', kind: 'fixed', amount: 0.46154, per: 'day' },
  ],
};
const quebec = { timezone: 'America/Toronto', billing_period_start_day: 1 };
// the peak events are 30-minute slots published by the integration
const peaks = (slots) =>
  createCalendarLookup(
    { 'hq-critical-peaks': { granularity: 'thirty_minutes', timezone: 'America/Toronto' } },
    slots.map((startsAt) => ({ calendar_key: 'hq-critical-peaks', starts_at: startsAt, value: 'critical-peak' })),
  );
const days = (year, month, count, kwh, hourUtc = 5) =>
  Array.from({ length: count }, (_, i) =>
    interval(new Date(Date.UTC(year, month - 1, i + 1, hourUtc)).toISOString(), kwh, { duration_minutes: 1440 }),
  );

describe('tariffs: Canada Hydro-Québec Flex D', () => {
  it('should price the peak events apart and keep their kWh out of the allowance', () => {
    // January 2027 (31 days, 1,240 kWh of off-peak allowance): 24 days at 50 kWh, then on the
    // 25th a peak slot at 06:00, a slot at 09:00 and one at 09:30
    const calendars = peaks(['2027-01-25T11:00:00Z']);
    const { costs, warnings } = price(
      tariff,
      quebec,
      [
        ...days(2027, 1, 24, 50),
        interval('2027-01-25T11:00:00Z', 10),
        interval('2027-01-25T14:00:00Z', 30),
        interval('2027-01-25T14:30:00Z', 20),
      ],
      { calendars },
    );
    expect(warnings).to.deep.equal([]);
    expect(costs[24].label).to.equal('Critical peak');
    expect(costs[24].components.energy).to.be.closeTo(10 * 0.46463, 1e-9);
    // 1,200 off-peak kWh before the 09:00 slot: its 30 kWh stay in the allowance although
    // the total of the period, peak included, is 1,210
    expect(costs[25].label).to.equal('Winter first 40 kWh per day');
    expect(costs[25].components.energy).to.be.closeTo(30 * 0.04886, 1e-9);
    // 1,230 off-peak kWh: 10 kWh left in the allowance, 10 beyond
    expect(costs[26].label).to.equal('Winter remaining kWh');
    expect(costs[26].components.energy).to.be.closeTo(10 * 0.04886 + 10 * 0.09103, 1e-9);
  });
  it('should size the allowance on the days of the month: 28 in February, 29 in a leap year', () => {
    // February 2026: 28 days at 41 kWh = 1,148 kWh, 1,120 in the allowance
    const february = price(tariff, quebec, days(2026, 2, 28, 41), { calendars: peaks([]) });
    expect(february.costs[26].label).to.equal('Winter first 40 kWh per day');
    expect(february.costs[27].label).to.equal('Winter remaining kWh');
    expect(february.costs[27].components.energy).to.be.closeTo(13 * 0.04886 + 28 * 0.09103, 1e-9);
    const februaryEnergy = february.costs.reduce((sum, c) => sum + c.components.energy, 0);
    expect(februaryEnergy).to.be.closeTo(1120 * 0.04886 + 28 * 0.09103, 1e-6);
    // February 2024: 29 days at 41 kWh = 1,189 kWh, 1,160 in the allowance
    const leap = price(tariff, quebec, days(2024, 2, 29, 41), { calendars: peaks([]) });
    expect(leap.costs).to.have.lengthOf(29);
    const leapEnergy = leap.costs.reduce((sum, c) => sum + c.components.energy, 0);
    expect(leapEnergy).to.be.closeTo(1160 * 0.04886 + 29 * 0.09103, 1e-6);
    expect(leap.costs[0].components.access).to.be.closeTo(0.46154, 1e-6);
  });
  it('should apply the summer tiers on the whole energy outside the winter season', () => {
    // July (31 days): 1,230 kWh already used, 10 kWh left in the allowance
    const { costs } = price(tariff, quebec, [interval('2027-07-20T20:00:00Z', 20)], {
      calendars: peaks([]),
      cumulative_before: { billing_period: 1230 },
    });
    expect(costs[0].label).to.equal('Summer remaining kWh');
    expect(costs[0].components.energy).to.be.closeTo(10 * 0.07065 + 10 * 0.11142, 1e-9);
  });
});
