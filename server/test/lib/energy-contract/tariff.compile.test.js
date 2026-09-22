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
      expect(compiled.tier).to.deep.equal({ cumulative: 'day', from_kwh: 0, to_kwh: Infinity });
      expect(compiled.power_threshold).to.deep.equal({ above_kw: 6 });
    });
    it('should keep a bounded tier', () => {
      expect(compileConditions({ tier: { cumulative: 'month', from_kwh: 10, to_kwh: 40 } }).tier).to.deep.equal({
        cumulative: 'month',
        from_kwh: 10,
        to_kwh: 40,
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
      expect(energy.rules[1].when.tier.to_kwh).to.equal(100);
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
    });
    it('should report a tariff without tiers', () => {
      const compiled = compileTariff({
        tariff_version: 1,
        components: [{ key: 'energy', kind: 'consumption', fallback: { price: 0.2 } }],
      });
      expect(compiled.hasTier).to.equal(false);
      expect(compiled.tierScopes).to.deep.equal([]);
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
