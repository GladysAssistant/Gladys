const { expect } = require('chai');
const {
  compileTariff,
  getCurrentPrice,
  getUnitPriceAt,
  createCalendarLookup,
} = require('../../../lib/energy-contract');

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
