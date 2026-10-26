const { expect } = require('chai');
const {
  compileTariff,
  getCurrentPrice,
  getUnitPriceAt,
  createCalendarLookup,
} = require('../../../lib/energy-contract/engine');

const utc = { timezone: 'UTC' };

describe('energy-contract getCurrentPrice', () => {
  const peakOffPeak = compileTariff({
    tariff_version: 1,
    components: [
      {
        key: 'energy',
        kind: 'consumption',
        rules: [{ label: 'Peak', when: { time: [['06:00', '22:00']] }, price: 0.27 }],
        fallback: { label: 'Off-peak', price: 0.2 },
      },
      { key: 'sub', kind: 'fixed', amount: 10, per: 'month' },
      { key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy', 'sub'] },
    ],
  });
  it('should give the current unit price with its taxes and the next change', () => {
    const current = getCurrentPrice(peakOffPeak, utc, { at: '2026-01-12T12:00:00Z' });
    expect(current).to.deep.equal({
      price: 0.324,
      label: 'Peak',
      valid_until: '2026-01-12T22:00:00.000Z',
      next_price: 0.24,
      next_label: 'Off-peak',
    });
    const night = getCurrentPrice(peakOffPeak, utc, { at: new Date(Date.UTC(2026, 0, 12, 23, 10)) });
    expect(night.price).to.equal(0.24);
    expect(night.valid_until).to.equal('2026-01-13T06:00:00.000Z');
    expect(night.next_price).to.equal(0.324);
  });
  it('should report no change when the price is flat over the horizon', () => {
    const base = compileTariff({
      tariff_version: 1,
      components: [{ key: 'energy', kind: 'consumption', fallback: { price: 0.2 } }],
    });
    const current = getCurrentPrice(base, utc, { at: '2026-01-12T12:00:00Z', horizon_hours: 1 });
    expect(current).to.deep.equal({
      price: 0.2,
      label: undefined,
      valid_until: null,
      next_price: null,
      next_label: undefined,
    });
    const now = getCurrentPrice(base, utc);
    expect(now.price).to.equal(0.2);
    const catchAll = compileTariff({
      tariff_version: 1,
      components: [{ key: 'energy', kind: 'consumption', rules: [{ label: 'All day', price: 0.21 }] }],
    });
    expect(getCurrentPrice(catchAll, utc, { at: '2026-01-12T12:00:00Z', horizon_hours: 1 })).to.deep.include({
      price: 0.21,
      label: 'All day',
      valid_until: null,
    });
  });
  it('should detect a change of rule label even at the same price', () => {
    const compiled = compileTariff({
      tariff_version: 1,
      components: [
        {
          key: 'energy',
          kind: 'consumption',
          rules: [
            { label: 'Morning', when: { time: [['06:00', '12:00']] }, price: 0.2 },
            { label: 'Afternoon', when: { time: [['12:00', '18:00']] }, price: 0.2 },
          ],
          fallback: { label: 'Night', price: 0.2 },
        },
      ],
    });
    const current = getCurrentPrice(compiled, utc, { at: '2026-01-12T11:00:00Z' });
    expect(current.valid_until).to.equal('2026-01-12T12:00:00.000Z');
    expect(current.next_label).to.equal('Afternoon');
  });
  it('should pick the tier the next kWh falls in', () => {
    const tiered = compileTariff({
      tariff_version: 1,
      components: [
        {
          key: 'energy',
          kind: 'consumption',
          rules: [
            { label: 'Tier 1', when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 40 } }, price: 0.07 },
            { label: 'Tier 2', when: { tier: { cumulative: 'day', from_kwh: 40 } }, price: 0.1 },
          ],
          fallback: { price: 0.1 },
        },
      ],
    });
    expect(getUnitPriceAt(tiered, utc, Date.UTC(2026, 0, 12, 12), createCalendarLookup(), { day: 39.9 })).to.deep.equal(
      {
        price: 0.07,
        label: 'Tier 1',
      },
    );
    expect(getCurrentPrice(tiered, utc, { at: '2026-01-12T12:00:00Z', cumulative: { day: 40 } }).label).to.equal(
      'Tier 2',
    );
  });
  it('should read the filtered counter and the per-day bounds of a tier', () => {
    const compiled = compileTariff({
      tariff_version: 1,
      calendars: ['peaks'],
      components: [
        {
          key: 'energy',
          kind: 'consumption',
          rules: [
            { label: 'Peak', when: { calendar: { peaks: 'peak' } }, price: 0.5 },
            {
              label: 'Tier 1',
              when: {
                tier: {
                  cumulative: 'billing_period',
                  from_kwh_per_day: 0,
                  to_kwh_per_day: 40,
                  counts_when: { not_calendar: { peaks: 'peak' } },
                },
              },
              price: 0.05,
            },
          ],
          fallback: { label: 'Tier 2', price: 0.09 },
        },
      ],
    });
    const [counter] = compiled.counters;
    const at = Date.UTC(2026, 0, 12, 12);
    const lookup = createCalendarLookup();
    // 31 days in January: 1,240 kWh in tier 1, judged on the off-peak counter, not on the total
    const cumulative = { billing_period: 1300, counters: { [counter.id]: { scope: 'billing_period', kwh: 1239 } } };
    expect(getUnitPriceAt(compiled, utc, at, lookup, cumulative).label).to.equal('Tier 1');
    cumulative.counters[counter.id].kwh = 1240;
    expect(getUnitPriceAt(compiled, utc, at, lookup, cumulative).label).to.equal('Tier 2');
    // a contract that started on 12 January only counts 20 days: 800 kWh
    expect(getUnitPriceAt(compiled, { ...utc, valid_from: '2026-01-12' }, at, lookup, cumulative).label).to.equal(
      'Tier 2',
    );
    cumulative.counters[counter.id].kwh = 799;
    expect(getUnitPriceAt(compiled, { ...utc, valid_from: '2026-01-12' }, at, lookup, cumulative).label).to.equal(
      'Tier 1',
    );
  });
  it('should restart the accumulations when the scan crosses a period boundary', () => {
    // Rate D: 40 kWh per day of the billing period
    const rateD = compileTariff({
      tariff_version: 1,
      components: [
        {
          key: 'energy',
          kind: 'consumption',
          rules: [
            {
              label: 'Tier 1',
              when: { tier: { cumulative: 'billing_period', from_kwh_per_day: 0, to_kwh_per_day: 40 } },
              price: 0.07,
            },
          ],
          fallback: { label: 'Tier 2', price: 0.1 },
        },
      ],
    });
    // 31 January, 1,200 kWh used of the 1,240 allowed: the February allowance (1,120) is not
    // judged on the January total, the period restarts at midnight
    const stillTier1 = getCurrentPrice(rateD, utc, {
      at: '2026-01-31T12:00:00Z',
      cumulative: { billing_period: 1200 },
    });
    expect(stillTier1.label).to.equal('Tier 1');
    expect(stillTier1.valid_until).to.equal(null);
    // 1,300 kWh: in tier 2 today, back in tier 1 with the new period
    const backToTier1 = getCurrentPrice(rateD, utc, {
      at: '2026-01-31T12:00:00Z',
      cumulative: { billing_period: 1300 },
    });
    expect(backToTier1.label).to.equal('Tier 2');
    expect(backToTier1.valid_until).to.equal('2026-02-01T00:00:00.000Z');
    expect(backToTier1.next_label).to.equal('Tier 1');
    expect(backToTier1.next_price).to.equal(0.07);
  });
  it('should use the peak power the caller knows for power_threshold rules', () => {
    const compiled = compileTariff({
      tariff_version: 1,
      components: [
        {
          key: 'energy',
          kind: 'consumption',
          rules: [{ label: 'Above 6 kW', when: { power_threshold: { above_kw: 6 } }, price: 0.5 }],
          fallback: { label: 'Normal', price: 0.2 },
        },
      ],
    });
    expect(getCurrentPrice(compiled, utc, { at: '2026-01-12T12:00:00Z', horizon_hours: 1 }).label).to.equal('Normal');
    expect(
      getCurrentPrice(compiled, utc, { at: '2026-01-12T12:00:00Z', horizon_hours: 1, max_power_kw: 7 }).label,
    ).to.equal('Above 6 kW');
  });
  it('should scan the slot boundaries of the contract local clock', () => {
    // Asia/Kathmandu is UTC+05:45: the local 22:00 boundary is 16:15 UTC
    const kathmandu = { timezone: 'Asia/Kathmandu' };
    const current = getCurrentPrice(peakOffPeak, kathmandu, { at: '2026-01-12T10:00:10Z' });
    expect(current.label).to.equal('Peak');
    expect(current.valid_until).to.equal('2026-01-12T16:15:00.000Z');
  });
  it('should evaluate the current slot start, so a live instant reads its 30-minute calendar entry', () => {
    const spot = compileTariff({
      tariff_version: 1,
      calendars: ['spot'],
      components: [{ key: 'energy', kind: 'consumption', fallback: { price_from_calendar: 'spot' } }],
    });
    const calendars = createCalendarLookup({ spot: { granularity: 'thirty_minutes' } }, [
      { calendar_key: 'spot', starts_at: '2026-01-12T12:00:00Z', value: 0.1 },
      { calendar_key: 'spot', starts_at: '2026-01-12T12:30:00Z', value: 0.2 },
    ]);
    ['2026-01-12T12:00:00.500Z', '2026-01-12T12:10:00Z', '2026-01-12T12:29:59.999Z'].forEach((at) => {
      const current = getCurrentPrice(spot, utc, { at, calendars });
      expect(current.price, at).to.equal(0.1);
      expect(current.valid_until, at).to.equal('2026-01-12T12:30:00.000Z');
      expect(current.next_price, at).to.equal(0.2);
    });
    // Kathmandu (+05:45): 12:10Z is 17:55 local, whose slot started at 17:30 local = 11:45Z
    const kathmanduCalendars = createCalendarLookup({ spot: { granularity: 'thirty_minutes' } }, [
      { calendar_key: 'spot', starts_at: '2026-01-12T11:45:00Z', value: 0.3 },
    ]);
    expect(
      getCurrentPrice(
        spot,
        { timezone: 'Asia/Kathmandu' },
        { at: '2026-01-12T12:10:00Z', calendars: kathmanduCalendars },
      ).price,
    ).to.equal(0.3);
  });
  it('should snap to the quarter and announce a change at :15 when the tariff reads a 15-minute calendar', () => {
    const spot = compileTariff({
      tariff_version: 1,
      calendars: ['spot-fi'],
      components: [{ key: 'energy', kind: 'consumption', fallback: { price_from_calendar: 'spot-fi' } }],
    });
    const calendars = createCalendarLookup({ 'spot-fi': { granularity: 'fifteen_minutes' } }, [
      { calendar_key: 'spot-fi', starts_at: '2026-01-12T12:00:00Z', value: 0.1 },
      { calendar_key: 'spot-fi', starts_at: '2026-01-12T12:15:00Z', value: 0.2 },
      { calendar_key: 'spot-fi', starts_at: '2026-01-12T12:30:00Z', value: 0.2 },
      { calendar_key: 'spot-fi', starts_at: '2026-01-12T12:45:00Z', value: 0.25 },
    ]);
    expect(getCurrentPrice(spot, utc, { at: '2026-01-12T12:05:00Z', calendars })).to.deep.include({
      price: 0.1,
      valid_until: '2026-01-12T12:15:00.000Z',
      next_price: 0.2,
    });
    // 12:20 is in the 12:15 quarter; the 12:30 quarter has the same price, the change is at 12:45
    expect(getCurrentPrice(spot, utc, { at: '2026-01-12T12:20:00Z', calendars })).to.deep.include({
      price: 0.2,
      valid_until: '2026-01-12T12:45:00.000Z',
      next_price: 0.25,
    });
    // Kathmandu (+05:45): 12:10Z is 17:55 local, whose quarter started at 17:45 local = 12:00Z
    expect(
      getCurrentPrice(spot, { timezone: 'Asia/Kathmandu' }, { at: '2026-01-12T12:10:00Z', calendars }),
    ).to.deep.include({ price: 0.1, valid_until: '2026-01-12T12:15:00.000Z' });
  });
  it('should name the rule of the first consumption component, never a levy declared after it', () => {
    const withLevy = compileTariff({
      tariff_version: 1,
      components: [
        {
          key: 'energy',
          kind: 'consumption',
          rules: [{ label: 'Peak', when: { time: [['06:00', '22:00']] }, price: 0.2 }],
          fallback: { label: 'Off-peak', price: 0.1 },
        },
        { key: 'levy', kind: 'consumption', fallback: { label: 'Electricity tax', price: 0.02 } },
      ],
    });
    expect(getCurrentPrice(withLevy, utc, { at: '2026-01-12T12:00:00Z' })).to.deep.equal({
      price: 0.22,
      label: 'Peak',
      valid_until: '2026-01-12T22:00:00.000Z',
      next_price: 0.12,
      next_label: 'Off-peak',
    });
  });
  it('should fall back like the interval pricing when the matching rule has no calendar price', () => {
    const compiled = compileTariff({
      tariff_version: 1,
      calendars: ['spot'],
      components: [
        {
          key: 'energy',
          kind: 'consumption',
          rules: [{ label: 'Spot', price_from_calendar: 'spot' }],
          fallback: { label: 'Backup', price: 0.25 },
        },
      ],
    });
    expect(getCurrentPrice(compiled, utc, { at: '2026-01-12T12:00:00Z', horizon_hours: 1 })).to.deep.include({
      price: 0.25,
      label: 'Backup',
    });
  });
  it('should answer null when a calendar value is missing', () => {
    const spot = compileTariff({
      tariff_version: 1,
      calendars: ['spot'],
      components: [
        { key: 'energy', kind: 'consumption', fallback: { price_from_calendar: 'spot' } },
        { key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy'] },
      ],
    });
    const calendars = createCalendarLookup({ spot: { granularity: 'thirty_minutes' } }, [
      { calendar_key: 'spot', starts_at: '2026-01-12T12:00:00Z', value: 0.1 },
    ]);
    const current = getCurrentPrice(spot, utc, { at: '2026-01-12T12:00:00Z', calendars });
    expect(current.price).to.equal(0.12);
    // the next slot has no spot price: the price becomes unknown
    expect(current.valid_until).to.equal('2026-01-12T12:30:00.000Z');
    expect(current.next_price).to.equal(null);
  });
});
