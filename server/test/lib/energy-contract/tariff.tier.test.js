const { expect } = require('chai');
const {
  canonicalJson,
  getTierCounterId,
  getAccumulationPeriodDays,
  getTierBounds,
  readTierCumulative,
  createAccumulation,
  carryMonthAccumulation,
  resetChangedPeriods,
} = require('../../../lib/energy-contract/tariff.tier');
const { compileTariff } = require('../../../lib/energy-contract/tariff.compile');
const { getLocalContext, getPeriodIds } = require('../../../lib/energy-contract/tariff.time');

const toronto = { timezone: 'America/Toronto' };
const context = (ms, extra = {}) => ({
  local: getLocalContext(ms, 'America/Toronto'),
  getCalendarValue: () => undefined,
  maxPowerKw: 0,
  ...extra,
});

describe('energy-contract tariff.tier', () => {
  it('should serialize a value with sorted keys', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: null, c: 'x' }] })).to.equal('{"a":[2,{"c":"x","d":null}],"b":1}');
  });
  it('should give the same counter to the same scope and conditions', () => {
    expect(getTierCounterId('day')).to.equal('day');
    expect(getTierCounterId('day', { calendar: { tempo: 'red' } })).to.equal('day:{"calendar":{"tempo":["red"]}}');
    expect(
      getTierCounterId('day', { calendar: { tempo: ['white', 'red', 'red'] }, weekdays: ['sun', 'mon'] }),
    ).to.equal(getTierCounterId('day', { weekdays: ['mon', 'sun'], calendar: { tempo: ['red', 'white'] } }));
    expect(getTierCounterId('day', { months: [12, 1] })).to.equal(getTierCounterId('day', { months: [1, 12] }));
    expect(getTierCounterId('month', { time: [['06:00', '22:00']], not_calendar: { peaks: 'peak' } })).to.equal(
      getTierCounterId('month', { not_calendar: { peaks: 'peak' }, time: [['06:00', '22:00']] }),
    );
    expect(getTierCounterId('month', { not_calendar: { peaks: 'peak' } })).to.not.equal(
      getTierCounterId('billing_period', { not_calendar: { peaks: 'peak' } }),
    );
  });
  it('should count the days of an accumulation period', () => {
    expect(getAccumulationPeriodDays('day', '2026-01-12', toronto)).to.equal(1);
    expect(getAccumulationPeriodDays('month', '2026-01-12', toronto)).to.equal(31);
    expect(getAccumulationPeriodDays('month', '2026-02-12', toronto)).to.equal(28);
    expect(getAccumulationPeriodDays('month', '2024-02-12', toronto)).to.equal(29);
    // a billing period from the 15th: 15 January → 15 February
    expect(
      getAccumulationPeriodDays('billing_period', '2026-01-20', { ...toronto, billing_period_start_day: 15 }),
    ).to.equal(31);
    expect(
      getAccumulationPeriodDays('billing_period', '2026-02-20', { ...toronto, billing_period_start_day: 15 }),
    ).to.equal(28);
  });
  it('should intersect the period with the contract validity', () => {
    // a contract starting on 15 January only counts its 17 days of January
    expect(getAccumulationPeriodDays('month', '2026-01-20', { ...toronto, valid_from: '2026-01-15' })).to.equal(17);
    // and ending on 20 January counts 6 of them
    expect(
      getAccumulationPeriodDays('month', '2026-01-18', {
        ...toronto,
        valid_from: '2026-01-15',
        valid_to: '2026-01-20',
      }),
    ).to.equal(6);
    // a validity wider than the period changes nothing
    expect(
      getAccumulationPeriodDays('month', '2026-01-18', {
        ...toronto,
        valid_from: '2025-12-01',
        valid_to: '2026-02-10',
      }),
    ).to.equal(31);
    // a Date bound is read in the contract timezone (5 January 03:00 UTC is still 4 January in Toronto)
    expect(
      getAccumulationPeriodDays('month', '2026-01-18', { ...toronto, valid_from: new Date('2026-01-05T03:00:00Z') }),
    ).to.equal(28);
    // an open bound (null) is ignored
    expect(getAccumulationPeriodDays('month', '2026-01-18', { ...toronto, valid_from: null, valid_to: null })).to.equal(
      31,
    );
    // a contract that does not cover the date at all still counts one day
    expect(getAccumulationPeriodDays('month', '2026-01-18', { ...toronto, valid_to: '2025-12-31' })).to.equal(1);
  });
  it('should scale the per-day bounds of a tier by the days of its period', () => {
    const fixed = { cumulative: 'day', per_day: false, from: 0, to: 40 };
    expect(getTierBounds(fixed, '2026-01-12', toronto)).to.deep.equal({ from: 0, to: 40 });
    const perDay = { cumulative: 'billing_period', per_day: true, from: 0, to: 40 };
    expect(getTierBounds(perDay, '2026-01-12', toronto)).to.deep.equal({ from: 0, to: 1240 });
    expect(getTierBounds(perDay, '2026-02-12', toronto)).to.deep.equal({ from: 0, to: 1120 });
    const openEnded = { cumulative: 'month', per_day: true, from: 40, to: Infinity };
    expect(getTierBounds(openEnded, '2026-02-12', toronto)).to.deep.equal({ from: 1120, to: Infinity });
  });
  it('should read the plain accumulation or the filtered counter of a tier', () => {
    const cumulative = { day: 3, month: 40, billing_period: 50, counters: { 'month:x': { scope: 'month', kwh: 30 } } };
    expect(readTierCumulative({ cumulative: 'month' }, cumulative)).to.equal(40);
    expect(readTierCumulative({ cumulative: 'month' }, {})).to.equal(0);
    expect(readTierCumulative({ cumulative: 'month', counts_when: {}, counter: 'month:x' }, cumulative)).to.equal(30);
    expect(readTierCumulative({ cumulative: 'month', counts_when: {}, counter: 'month:y' }, cumulative)).to.equal(0);
    expect(readTierCumulative({ cumulative: 'month', counts_when: {}, counter: 'month:x' }, { month: 40 })).to.equal(0);
  });
  describe('createAccumulation', () => {
    const compiled = compileTariff({
      tariff_version: 1,
      calendars: ['peaks'],
      components: [
        {
          key: 'energy',
          kind: 'consumption',
          rules: [
            {
              when: { tier: { cumulative: 'month', from_kwh: 0, counts_when: { not_calendar: { peaks: 'peak' } } } },
              price: 0.05,
            },
            {
              when: { tier: { cumulative: 'day', from_kwh: 0, counts_when: { not_calendar: { peaks: 'peak' } } } },
              price: 0.05,
            },
          ],
          fallback: { price: 0.1 },
        },
      ],
    });
    const [monthCounter, dayCounter] = compiled.counters.map((c) => c.id);

    it('should start from the caller accumulations, counters included', () => {
      const accumulation = createAccumulation(compiled, {
        month: 40,
        counters: { [monthCounter]: { scope: 'month', kwh: 30 } },
      });
      expect(accumulation.state).to.deep.equal({
        day: 0,
        month: 40,
        billing_period: 0,
        counters: { [monthCounter]: { scope: 'month', kwh: 30 }, [dayCounter]: { scope: 'day', kwh: 0 } },
      });
    });
    it('should feed a counter only with the intervals matching its conditions', () => {
      const accumulation = createAccumulation(compiled);
      const ms = Date.UTC(2026, 0, 12, 12);
      accumulation.add({ kwh: 2 }, context(ms));
      accumulation.add({ kwh: 5 }, context(ms, { getCalendarValue: () => 'peak' }));
      expect(accumulation.snapshot()).to.deep.equal({
        day: 7,
        month: 7,
        billing_period: 7,
        counters: { [monthCounter]: { scope: 'month', kwh: 2 }, [dayCounter]: { scope: 'day', kwh: 2 } },
      });
      // the snapshot is a copy
      accumulation.reset('day');
      expect(accumulation.state.day).to.equal(0);
      expect(accumulation.state.counters[dayCounter].kwh).to.equal(0);
      expect(accumulation.state.counters[monthCounter].kwh).to.equal(2);
    });
    it('should not carry counters when the tariff has none', () => {
      const plain = compileTariff({
        tariff_version: 1,
        components: [{ key: 'energy', kind: 'consumption', fallback: { price: 0.1 } }],
      });
      const accumulation = createAccumulation(plain, { day: 1 });
      accumulation.add({ kwh: 1 }, context(Date.UTC(2026, 0, 12, 12)));
      accumulation.reset('month');
      expect(accumulation.snapshot()).to.deep.equal({ day: 2, month: 0, billing_period: 1 });
    });
  });
  it('should reset the accumulations of the periods that changed between two instants', () => {
    const cumulative = {
      day: 3,
      month: 40,
      billing_period: 50,
      counters: { 'month:x': { scope: 'month', kwh: 30 }, 'day:x': { scope: 'day', kwh: 2 } },
    };
    const january = getPeriodIds('2026-01-31', 15, 'UTC');
    // same instant: the very same object
    expect(resetChangedPeriods(cumulative, january, getPeriodIds('2026-01-31', 15, 'UTC'))).to.equal(cumulative);
    // the next day, same month and billing period
    expect(resetChangedPeriods(cumulative, january, getPeriodIds('2026-02-01', 15, 'UTC'))).to.deep.equal({
      day: 0,
      month: 0,
      billing_period: 50,
      counters: { 'month:x': { scope: 'month', kwh: 0 }, 'day:x': { scope: 'day', kwh: 0 } },
    });
    // a new billing period on the 15th
    expect(
      resetChangedPeriods({ day: 3, month: 40, billing_period: 50 }, january, getPeriodIds('2026-02-15', 15, 'UTC')),
    ).to.deep.equal({
      day: 0,
      month: 0,
      billing_period: 0,
    });
  });
  it('should carry the month accumulation and counters to the next billing period', () => {
    expect(carryMonthAccumulation({ day: 3, month: 40, billing_period: 50 })).to.deep.equal({
      day: 0,
      month: 40,
      billing_period: 0,
    });
    expect(
      carryMonthAccumulation({
        day: 3,
        month: 40,
        billing_period: 50,
        counters: { 'month:x': { scope: 'month', kwh: 30 }, 'billing_period:x': { scope: 'billing_period', kwh: 45 } },
      }),
    ).to.deep.equal({
      day: 0,
      month: 40,
      billing_period: 0,
      counters: { 'month:x': { scope: 'month', kwh: 30 }, 'billing_period:x': { scope: 'billing_period', kwh: 0 } },
    });
  });
});
