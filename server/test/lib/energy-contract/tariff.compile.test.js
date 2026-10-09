const { expect } = require('chai');
const { substituteInputs, compileConditions, compileTariff } = require('../../../lib/energy-contract/tariff.compile');
const { BadParameters } = require('../../../utils/coreErrors');

describe('energy-contract tariff.compile', () => {
  describe('substituteInputs', () => {
    it('should replace an exact placeholder by the typed input value', () => {
      expect(substituteInputs('{{input:power}}', { power: 9 })).to.equal(9);
      expect(substituteInputs({ time: '{{input:slots}}' }, { slots: [['22:00', '06:00']] })).to.deep.equal({
        time: [['22:00', '06:00']],
      });
    });
    it('should replace placeholders inside a longer string by their text', () => {
      expect(substituteInputs('Tariff {{input:power}} kVA {{input:name}}', { power: 9, name: 'Base' })).to.equal(
        'Tariff 9 kVA Base',
      );
    });
    it('should walk arrays and objects and keep other values', () => {
      expect(substituteInputs([1, null, 'x', { a: '{{input:a}}' }], { a: true })).to.deep.equal([
        1,
        null,
        'x',
        { a: true },
      ]);
      expect(substituteInputs(null, {})).to.equal(null);
      expect(substituteInputs(3, {})).to.equal(3);
    });
    it('should throw on a missing input, exact or embedded', () => {
      expect(() => substituteInputs('{{input:missing}}', {})).to.throw(
        BadParameters,
        'tariff: missing input "missing"',
      );
      expect(() => substituteInputs('x {{input:missing}}', {})).to.throw(
        BadParameters,
        'tariff: missing input "missing"',
      );
    });
  });
  describe('compileConditions', () => {
    it('should return undefined without conditions', () => {
      expect(compileConditions(undefined)).to.equal(undefined);
    });
    it('should compile every condition into its numeric form', () => {
      const compiled = compileConditions({
        time: [['22:00', '06:00']],
        weekdays: ['mon', 'sun'],
        months: [1, 12],
        season: { from: '11-01', to: '03-31' },
        dates: { from: '2026-01-01', to: '2026-06-30' },
        calendar: { tempo: ['red', 'white'] },
        not_calendar: { holidays: 'holiday' },
        tier: { cumulative: 'day', from_kwh: 0 },
        power_threshold: { above_kw: 6 },
      });
      expect(compiled.time).to.deep.equal([
        { start: 1320, end: 1440 },
        { start: 0, end: 360 },
      ]);
      expect(Array.from(compiled.weekdays)).to.deep.equal([1, 0]);
      expect(Array.from(compiled.months)).to.deep.equal([1, 12]);
      expect(compiled.season).to.deep.equal({ from: 1101, to: 331 });
      expect(compiled.dates).to.deep.equal({ from: '2026-01-01', to: '2026-06-30' });
      expect(Array.from(compiled.calendar.tempo)).to.deep.equal(['red', 'white']);
      expect(Array.from(compiled.not_calendar.holidays)).to.deep.equal(['holiday']);
      expect(compiled.tier).to.deep.equal({
        cumulative: 'day',
        per_day: false,
        from: 0,
        to: Infinity,
        counter: 'day',
        counts_when: undefined,
      });
      expect(compiled.power_threshold).to.deep.equal({ above_kw: 6 });
    });
    it('should keep a bounded tier', () => {
      expect(compileConditions({ tier: { cumulative: 'month', from_kwh: 10, to_kwh: 40 } }).tier).to.deep.include({
        cumulative: 'month',
        per_day: false,
        from: 10,
        to: 40,
        counter: 'month',
      });
    });
    it('should compile a per-day tier with counting conditions', () => {
      const { tier } = compileConditions({
        tier: {
          cumulative: 'billing_period',
          from_kwh_per_day: 0,
          to_kwh_per_day: 40,
          counts_when: { not_calendar: { peaks: 'peak' }, time: [['06:00', '22:00']] },
        },
      });
      expect(tier).to.deep.include({
        cumulative: 'billing_period',
        per_day: true,
        from: 0,
        to: 40,
        counter: 'billing_period:{"not_calendar":{"peaks":["peak"]},"time":[["06:00","22:00"]]}',
      });
      expect(Array.from(tier.counts_when.not_calendar.peaks)).to.deep.equal(['peak']);
      expect(tier.counts_when.time).to.deep.equal([{ start: 360, end: 1320 }]);
      // an open-ended per-day tier
      expect(compileConditions({ tier: { cumulative: 'day', from_kwh_per_day: 40 } }).tier).to.deep.include({
        per_day: true,
        from: 40,
        to: Infinity,
        counter: 'day',
      });
    });
  });
  describe('compileTariff', () => {
    it('should substitute the inputs, validate and precompute every component kind', () => {
      const compiled = compileTariff(
        {
          tariff_version: 1,
          calendars: ['spot'],
          components: [
            {
              key: 'energy',
              kind: 'consumption',
              rules: [
                { label: 'Off-peak', when: { time: '{{input:off_peak}}' }, price: '{{input:off_peak_price}}' },
                {
                  when: { tier: { cumulative: 'billing_period', from_kwh: 0, to_kwh: 100 } },
                  price_from_calendar: 'spot',
                },
              ],
              fallback: { price_from_calendar: 'spot', multiplier: 1.1, offset: 0.02 },
            },
            { key: 'sub', kind: 'fixed', amount: '{{input:subscription}}', per: 'month', when: { months: [1] } },
            { key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy'] },
            { key: 'peak', kind: 'demand', price: 3, per: 'month' },
          ],
        },
        { off_peak: [['22:00', '06:00']], off_peak_price: 0.1, subscription: 12 },
      );
      expect(compiled.calendars).to.deep.equal(['spot']);
      expect(compiled.hasTier).to.equal(true);
      expect(compiled.tierScopes).to.deep.equal(['billing_period']);
      const [energy, sub, vat, peak] = compiled.components;
      expect(energy.rules[0]).to.deep.include({ label: 'Off-peak', price: 0.1, multiplier: 1, offset: 0 });
      expect(energy.rules[0].when.time).to.have.lengthOf(2);
      expect(energy.rules[1].when.tier.to).to.equal(100);
      expect(compiled.counters).to.deep.equal([]);
      expect(energy.fallback).to.deep.equal({
        label: undefined,
        price: undefined,
        price_from_calendar: 'spot',
        multiplier: 1.1,
        offset: 0.02,
      });
      expect(sub.amount).to.equal(12);
      expect(Array.from(sub.when.months)).to.deep.equal([1]);
      expect(vat).to.deep.equal({ key: 'vat', kind: 'tax', label: undefined, rate: 20, applies_to: ['energy'] });
      expect(peak.aggregation).to.equal('max');
      expect(peak.when).to.equal(undefined);
      // a demand charge reads the peak power of the intervals
      expect(compiled.needsPower).to.equal(true);
    });
    it('should list the filtered counters of the counts_when tiers once per scope and conditions', () => {
      const countsWhen = { not_calendar: { peaks: 'peak' } };
      const compiled = compileTariff({
        tariff_version: 1,
        calendars: ['peaks'],
        components: [
          {
            key: 'energy',
            kind: 'consumption',
            rules: [
              { when: { calendar: { peaks: 'peak' } }, price: 0.5 },
              {
                when: {
                  tier: { cumulative: 'month', from_kwh_per_day: 0, to_kwh_per_day: 40, counts_when: countsWhen },
                },
                price: 0.05,
              },
              // the same counter, written in another key order
              {
                when: {
                  tier: {
                    cumulative: 'month',
                    from_kwh_per_day: 40,
                    counts_when: { not_calendar: { peaks: ['peak'] } },
                  },
                },
                price: 0.09,
              },
              { when: { tier: { cumulative: 'day', from_kwh: 0, counts_when: countsWhen } }, price: 0.1 },
            ],
            fallback: { price: 0.1 },
          },
        ],
      });
      expect(compiled.hasTier).to.equal(true);
      expect(compiled.tierScopes).to.deep.equal(['month', 'day']);
      expect(compiled.counters.map((c) => [c.id, c.scope])).to.deep.equal([
        ['month:{"not_calendar":{"peaks":["peak"]}}', 'month'],
        ['day:{"not_calendar":{"peaks":["peak"]}}', 'day'],
      ]);
      expect(Array.from(compiled.counters[0].when.not_calendar.peaks)).to.deep.equal(['peak']);
      const [energy] = compiled.components;
      expect(energy.rules[1].when.tier.counter).to.equal(energy.rules[2].when.tier.counter);
    });
    it('should report a tariff without tiers', () => {
      const compiled = compileTariff({
        tariff_version: 1,
        components: [{ key: 'energy', kind: 'consumption', fallback: { price: 0.2 } }],
      });
      expect(compiled.hasTier).to.equal(false);
      expect(compiled.tierScopes).to.deep.equal([]);
      expect(compiled.counters).to.deep.equal([]);
      expect(compiled.needsPower).to.equal(false);
    });
    it('should need the power when a rule has a power threshold', () => {
      const compiled = compileTariff({
        tariff_version: 1,
        components: [
          {
            key: 'energy',
            kind: 'consumption',
            rules: [{ when: { power_threshold: { above_kw: 3 } }, price: 0.5 }],
            fallback: { price: 0.2 },
          },
        ],
      });
      expect(compiled.needsPower).to.equal(true);
    });
    it('should reject an invalid tariff after substitution', () => {
      expect(() =>
        compileTariff(
          {
            tariff_version: 1,
            components: [{ key: 'energy', kind: 'consumption', fallback: { price: '{{input:p}}' } }],
          },
          { p: 'free' },
        ),
      ).to.throw(BadParameters, 'tariff.components[0].fallback.price');
    });
  });
});
