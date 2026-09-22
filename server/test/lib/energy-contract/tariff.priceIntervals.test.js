const { expect } = require('chai');
const {
  compileTariff,
  priceIntervals,
  createCalendarLookup,
  CALENDAR_WARNING_REASONS,
} = require('../../../lib/energy-contract/engine');
const { prepareIntervals, roundCost, resolvePrice } = require('../../../lib/energy-contract/tariff.priceIntervals');

const paris = { timezone: 'Europe/Paris' };
const tariff = (components, calendars) => compileTariff({ tariff_version: 1, calendars, components });
const consumption = (extra) => ({ key: 'energy', kind: 'consumption', ...extra });

describe('energy-contract priceIntervals', () => {
  it('should price a base contract with a monthly subscription spread over the intervals', () => {
    const compiled = tariff([
      consumption({ fallback: { label: 'Base', price: 0.2 } }),
      { key: 'sub', kind: 'fixed', amount: 30, per: 'month' },
    ]);
    const { costs, warnings, cumulative } = priceIntervals(compiled, { timezone: 'UTC' }, [
      { starts_at: '2026-01-12T12:00:00Z', kwh: 1.5 },
    ]);
    expect(warnings).to.deep.equal([]);
    expect(costs).to.have.lengthOf(1);
    expect(costs[0].starts_at).to.equal('2026-01-12T12:00:00.000Z');
    expect(costs[0].label).to.equal('Base');
    expect(costs[0].components.energy).to.equal(0.3);
    // 30 € over the 44,640 minutes of January, 30 minutes of them
    expect(costs[0].components.sub).to.be.closeTo(30 * (30 / 44640), 1e-6);
    expect(costs[0].cost).to.be.closeTo(0.3 + 30 * (30 / 44640), 1e-6);
    expect(cumulative).to.deep.equal({ day: 1.5, month: 1.5, billing_period: 1.5 });
  });
  it('should spread a daily fee over the real duration of clock-change days', () => {
    const compiled = tariff([
      consumption({ fallback: { price: 0 } }),
      { key: 'supply', kind: 'fixed', amount: 1, per: 'day' },
    ]);
    const { costs } = priceIntervals(compiled, paris, [
      { starts_at: '2026-03-28T12:00:00Z', kwh: 0 }, // 24 h day
      { starts_at: '2026-03-29T12:00:00Z', kwh: 0 }, // 23 h day (DST start)
      { starts_at: '2026-10-25T12:00:00Z', kwh: 0 }, // 25 h day (DST end)
    ]);
    expect(costs[0].components.supply).to.be.closeTo(30 / 1440, 1e-6);
    expect(costs[1].components.supply).to.be.closeTo(30 / 1380, 1e-6);
    expect(costs[2].components.supply).to.be.closeTo(30 / 1500, 1e-6);
  });
  it('should apply a fixed component only when its period conditions hold', () => {
    const compiled = tariff([
      consumption({ fallback: { price: 0 } }),
      { key: 'winter_fee', kind: 'fixed', amount: 10, per: 'month', when: { months: [1, 2, 12] } },
    ]);
    const { costs } = priceIntervals(compiled, { timezone: 'UTC' }, [
      { starts_at: '2026-01-12T12:00:00Z', kwh: 0 },
      { starts_at: '2026-07-12T12:00:00Z', kwh: 0 },
    ]);
    expect(costs[0].components.winter_fee).to.be.closeTo(10 * (30 / 44640), 1e-6);
    expect(costs[1].components.winter_fee).to.equal(0);
  });
  it('should split an interval across tiers and reset the accumulation with the period', () => {
    const compiled = tariff([
      consumption({
        rules: [{ label: 'Tier 1', when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 2 } }, price: 0.1 }],
        fallback: { label: 'Tier 2', price: 0.3 },
      }),
    ]);
    const { costs, cumulative } = priceIntervals(compiled, { timezone: 'UTC' }, [
      { starts_at: '2026-01-12T10:00:00Z', kwh: 1.5 },
      { starts_at: '2026-01-12T10:30:00Z', kwh: 1 },
      { starts_at: '2026-01-13T10:00:00Z', kwh: 1 },
    ]);
    expect(costs[0].cost).to.be.closeTo(0.15, 1e-9);
    expect(costs[0].label).to.equal('Tier 1');
    // 0.5 kWh left in tier 1, 0.5 kWh in tier 2
    expect(costs[1].cost).to.be.closeTo(0.05 + 0.15, 1e-9);
    expect(costs[1].label).to.equal('Tier 2');
    // new day: the accumulation restarts
    expect(costs[2].cost).to.be.closeTo(0.1, 1e-9);
    expect(cumulative.day).to.equal(1);
    expect(cumulative.month).to.equal(3.5);
  });
  it('should start from the accumulation the caller already knows', () => {
    const compiled = tariff([
      consumption({
        rules: [{ when: { tier: { cumulative: 'billing_period', from_kwh: 0, to_kwh: 2 } }, price: 0.1 }],
        fallback: { price: 0.3 },
      }),
    ]);
    const { costs } = priceIntervals(
      compiled,
      { timezone: 'UTC', billing_period_start_day: 5 },
      [{ starts_at: '2026-01-12T10:00:00Z', kwh: 0.5 }],
      { cumulative_before: { billing_period: 1.8 } },
    );
    expect(costs[0].cost).to.be.closeTo(0.2 * 0.1 + 0.3 * 0.3, 1e-9);
  });
  it('should skip a tier rule that does not cover the interval energy', () => {
    const compiled = tariff([
      consumption({
        rules: [{ when: { tier: { cumulative: 'month', from_kwh: 10 } }, price: 0.1 }],
        fallback: { price: 0.3 },
      }),
    ]);
    const { costs } = priceIntervals(compiled, { timezone: 'UTC' }, [{ starts_at: '2026-01-12T10:00:00Z', kwh: 1 }]);
    expect(costs[0].cost).to.be.closeTo(0.3, 1e-9);
  });
  it('should fall back with a warning when a calendar price is missing', () => {
    const compiled = tariff(
      [
        consumption({
          rules: [{ when: { time: [['00:00', '24:00']] }, price_from_calendar: 'spot', multiplier: 1.2, offset: 0.03 }],
          fallback: { label: 'Backup', price: 0.25 },
        }),
      ],
      ['spot'],
    );
    const calendars = createCalendarLookup({ spot: { granularity: 'thirty_minutes' } }, [
      { calendar_key: 'spot', starts_at: '2026-01-12T10:00:00Z', value: 0.1 },
      { calendar_key: 'spot', starts_at: '2026-01-12T11:00:00Z', value: 'n/a' },
    ]);
    const { costs, warnings } = priceIntervals(
      compiled,
      { timezone: 'UTC' },
      [
        { starts_at: '2026-01-12T10:00:00Z', kwh: 1 },
        { starts_at: '2026-01-12T10:30:00Z', kwh: 1 },
        { starts_at: '2026-01-12T11:00:00Z', kwh: 1 },
      ],
      { calendars },
    );
    expect(costs[0].cost).to.be.closeTo(0.15, 1e-9);
    expect(costs[1].cost).to.be.closeTo(0.25, 1e-9);
    expect(costs[1].label).to.equal('Backup');
    expect(costs[2].cost).to.be.closeTo(0.25, 1e-9);
    expect(warnings).to.deep.equal([
      {
        starts_at: '2026-01-12T10:30:00.000Z',
        component_key: 'energy',
        calendar_key: 'spot',
        reason: CALENDAR_WARNING_REASONS.CALENDAR_MISSING,
      },
      {
        starts_at: '2026-01-12T11:00:00.000Z',
        component_key: 'energy',
        calendar_key: 'spot',
        reason: CALENDAR_WARNING_REASONS.CALENDAR_MISSING,
      },
    ]);
  });
  it('should send the energy to the fallback, never to a later rule, when the matching rule has no calendar price', () => {
    const compiled = tariff(
      [
        consumption({
          rules: [
            { label: 'Spot', price_from_calendar: 'spot' },
            { label: 'Later', price: 0.9 },
          ],
          fallback: { label: 'Backup', price: 0.25 },
        }),
      ],
      ['spot'],
    );
    const { costs, warnings } = priceIntervals(compiled, { timezone: 'UTC' }, [
      { starts_at: '2026-01-12T10:00:00Z', kwh: 2 },
    ]);
    expect(costs[0].cost).to.be.closeTo(0.5, 1e-9);
    expect(costs[0].label).to.equal('Backup');
    expect(warnings).to.have.lengthOf(1);
    const tiered = tariff(
      [
        consumption({
          rules: [
            { label: 'Tier 1', when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 1 } }, price: 0.1 },
            { label: 'Tier 2 spot', when: { tier: { cumulative: 'day', from_kwh: 1 } }, price_from_calendar: 'spot' },
            { label: 'Later', price: 0.9 },
          ],
          fallback: { label: 'Backup', price: 0.25 },
        }),
      ],
      ['spot'],
    );
    const second = priceIntervals(tiered, { timezone: 'UTC' }, [{ starts_at: '2026-01-12T10:00:00Z', kwh: 2 }]);
    // 1 kWh in tier 1, the missing tier 2 price sends the remaining kWh to the fallback
    expect(second.costs[0].cost).to.be.closeTo(0.1 + 0.25, 1e-9);
    expect(second.costs[0].label).to.equal('Backup');
    expect(second.warnings).to.have.lengthOf(1);
  });
  it('should warn and price nothing when even the last resort has no price', () => {
    const withoutFallback = tariff([consumption({ rules: [{ price_from_calendar: 'spot' }] })], ['spot']);
    const first = priceIntervals(withoutFallback, { timezone: 'UTC' }, [{ starts_at: '2026-01-12T10:00:00Z', kwh: 1 }]);
    expect(first.costs[0].cost).to.equal(0);
    expect(first.warnings.map((w) => w.reason)).to.deep.equal([
      CALENDAR_WARNING_REASONS.CALENDAR_MISSING,
      CALENDAR_WARNING_REASONS.NO_PRICE,
    ]);
    expect(first.warnings[1].calendar_key).to.equal(undefined);
    const tierWithCalendar = tariff(
      [
        consumption({
          rules: [{ when: { tier: { cumulative: 'day', from_kwh: 0 } }, price_from_calendar: 'spot' }],
          fallback: { price_from_calendar: 'spot' },
        }),
      ],
      ['spot'],
    );
    const second = priceIntervals(tierWithCalendar, { timezone: 'UTC' }, [
      { starts_at: '2026-01-12T10:00:00Z', kwh: 1 },
    ]);
    expect(second.costs[0].cost).to.equal(0);
    expect(second.warnings.map((w) => w.reason)).to.deep.equal([
      CALENDAR_WARNING_REASONS.CALENDAR_MISSING,
      CALENDAR_WARNING_REASONS.NO_PRICE,
    ]);
    expect(second.warnings[1].calendar_key).to.equal('spot');
  });
  it('should apply taxes to the listed components only', () => {
    const compiled = tariff([
      consumption({ fallback: { price: 0.2 } }),
      { key: 'sub', kind: 'fixed', amount: 44.64, per: 'month' },
      { key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy'] },
      { key: 'vat_full', kind: 'tax', rate: 5.5, applies_to: ['energy', 'sub', 'vat'] },
    ]);
    const { costs } = priceIntervals(compiled, { timezone: 'UTC' }, [{ starts_at: '2026-01-12T12:00:00Z', kwh: 1 }]);
    expect(costs[0].components.sub).to.be.closeTo(0.03, 1e-9);
    expect(costs[0].components.vat).to.be.closeTo(0.04, 1e-9);
    expect(costs[0].components.vat_full).to.be.closeTo((0.2 + 0.03 + 0.04) * 0.055, 1e-6);
  });
  it('should include demand charges only for closed periods', () => {
    const compiled = tariff([
      consumption({ fallback: { price: 0.1 } }),
      { key: 'peak', kind: 'demand', price: 5, per: 'month' },
    ]);
    const intervals = [
      { starts_at: '2026-01-12T12:00:00Z', kwh: 1, max_power_kw: 2 },
      { starts_at: '2026-01-12T12:30:00Z', kwh: 2, max_power_kw: 4 },
    ];
    const open = priceIntervals(compiled, { timezone: 'UTC' }, intervals);
    expect(open.costs.map((c) => c.components.peak)).to.deep.equal([0, 0]);
    const closed = priceIntervals(compiled, { timezone: 'UTC' }, intervals, { closed_period: true });
    // 5 per kW on a 4 kW peak = 20, half on each 30-minute interval
    expect(closed.costs.map((c) => c.components.peak)).to.deep.equal([10, 10]);
    expect(closed.costs[1].cost).to.be.closeTo(10.2, 1e-9);
  });
  it('should give a demand component nothing when its period conditions do not hold', () => {
    const compiled = tariff([
      consumption({ fallback: { price: 0 } }),
      { key: 'peak', kind: 'demand', price: 5, per: 'month', when: { season: { from: '06-01', to: '09-30' } } },
    ]);
    const { costs } = priceIntervals(compiled, { timezone: 'UTC' }, [{ starts_at: '2026-01-12T12:00:00Z', kwh: 1 }], {
      closed_period: true,
    });
    expect(costs[0].components.peak).to.equal(0);
  });
  it('should read calendars in the calendar timezone with the day start shift', () => {
    const compiled = tariff(
      [
        consumption({
          rules: [{ label: 'Red', when: { calendar: { tempo: 'red' } }, price: 0.7 }],
          fallback: { label: 'Other', price: 0.1 },
        }),
      ],
      ['tempo'],
    );
    const calendars = createCalendarLookup(
      { tempo: { granularity: 'day', timezone: 'Europe/Paris', day_starts_at: '06:00' } },
      [{ calendar_key: 'tempo', date: '2026-01-12', value: 'red' }],
    );
    const { costs } = priceIntervals(
      compiled,
      paris,
      [
        { starts_at: '2026-01-12T04:30:00Z', kwh: 1 }, // 05:30 Paris on the 12th: colour of the 11th (none)
        { starts_at: '2026-01-12T05:00:00Z', kwh: 1 }, // 06:00: red
        { starts_at: '2026-01-13T04:30:00Z', kwh: 1 }, // 05:30 on the 13th: still red
        { starts_at: '2026-01-13T05:00:00Z', kwh: 1 }, // 06:00 on the 13th: none
      ],
      { calendars },
    );
    expect(costs.map((c) => c.label)).to.deep.equal(['Other', 'Red', 'Red', 'Other']);
  });
  it('should keep the label of the rule that priced the last share', () => {
    const compiled = tariff([
      consumption({
        rules: [
          { when: { time: [['06:00', '22:00']] }, price: 0.3 },
          { label: 'Night', when: { time: [['22:00', '06:00']] }, price: 0.1 },
        ],
        fallback: { price: 0.2 },
      }),
    ]);
    const { costs } = priceIntervals(compiled, { timezone: 'UTC' }, [
      { starts_at: '2026-01-12T12:00:00Z', kwh: 1 },
      { starts_at: '2026-01-12T23:00:00Z', kwh: 1 },
    ]);
    expect(costs[0].label).to.equal(undefined);
    expect(costs[1].label).to.equal('Night');
  });
  it('should round costs to 6 decimals', () => {
    expect(roundCost(0.1234567)).to.equal(0.123457);
    expect(roundCost(1 / 3)).to.equal(0.333333);
  });
  it('should resolve prices from calendars only when they are numbers', () => {
    const spec = { price_from_calendar: 'spot', multiplier: 2, offset: 0.5 };
    expect(resolvePrice(spec, () => 0.1)).to.be.closeTo(0.7, 1e-9);
    expect(resolvePrice(spec, () => 'red')).to.equal(undefined);
    expect(resolvePrice(spec, () => Infinity)).to.equal(undefined);
    expect(resolvePrice({ price: 0.2, multiplier: 1, offset: 0 }, () => 0.1)).to.equal(0.2);
  });
  describe('prepareIntervals', () => {
    it('should normalize, derive the peak power and sort the intervals', () => {
      const prepared = prepareIntervals(
        [
          { starts_at: new Date(Date.UTC(2026, 0, 12, 13)), kwh: 'abc', max_power_kw: null },
          { starts_at: '2026-01-12T12:00:00Z', kwh: '1.5', duration_minutes: 1440 },
          { starts_at: Date.UTC(2026, 0, 12, 12, 30), kwh: 2, max_power_kw: 7 },
        ],
        'Europe/Paris',
        15,
      );
      expect(prepared.map((i) => i.startsAt)).to.deep.equal([
        '2026-01-12T12:00:00.000Z',
        '2026-01-12T12:30:00.000Z',
        '2026-01-12T13:00:00.000Z',
      ]);
      expect(prepared[0]).to.deep.include({ kwh: 1.5, durationMinutes: 1440, maxPowerKw: 1.5 / 24 });
      expect(prepared[1]).to.deep.include({ kwh: 2, durationMinutes: 30, maxPowerKw: 7 });
      expect(prepared[2]).to.deep.include({ kwh: 0, durationMinutes: 30, maxPowerKw: 0 });
      expect(prepared[0].periodIds).to.deep.equal({
        day: '2026-01-12',
        month: '2026-01',
        billing_period: '2025-12-15',
      });
      expect(prepared[0].local.minutes).to.equal(13 * 60);
    });
  });
});
