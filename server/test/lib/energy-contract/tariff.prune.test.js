const { expect } = require('chai');
const { pruneTariffToValidity, isOutsideValidity } = require('../../../lib/energy-contract/tariff.prune');

const dated = (from, to) => ({ dates: to ? { from, to } : { from } });

describe('energy-contract pruneTariffToValidity', () => {
  it('should tell whether a dates condition is outside the validity window', () => {
    expect(isOutsideValidity(dated('2020-01-01', '2020-12-31'), '2026-01-01')).to.equal(true);
    expect(isOutsideValidity(dated('2027-01-01'), '2026-01-01', '2026-12-31')).to.equal(true);
    // overlapping, open-ended or touching the bounds
    expect(isOutsideValidity(dated('2020-01-01', '2026-01-01'), '2026-01-01')).to.equal(false);
    expect(isOutsideValidity(dated('2020-01-01'), '2026-01-01', '2026-12-31')).to.equal(false);
    expect(isOutsideValidity(dated('2026-12-31'), '2026-01-01', '2026-12-31')).to.equal(false);
    // an open window keeps everything
    expect(isOutsideValidity(dated('2020-01-01', '2020-12-31'))).to.equal(false);
    expect(isOutsideValidity(dated('2027-01-01'), '2026-01-01', null)).to.equal(false);
    // no dates, or malformed ones: kept, the validation reports them
    expect(isOutsideValidity(undefined, '2026-01-01')).to.equal(false);
    expect(isOutsideValidity({ months: [1] }, '2026-01-01')).to.equal(false);
    expect(isOutsideValidity({ dates: { to: '2020-12-31' } }, '2026-01-01')).to.equal(false);
    expect(isOutsideValidity({ dates: { from: '2020-01-01', to: 'soon' } }, '2026-01-01')).to.equal(false);
  });

  it('should drop the consumption rules dated outside the validity and keep the others', () => {
    const rules = [
      { when: { ...dated('2024-02-01', '2025-01-31'), time: [['22:00', '06:00']] }, price: 0.1 },
      { when: dated('2024-02-01', '2025-01-31'), price: 0.2 },
      { when: dated('2025-02-01', '2026-01-31'), price: 0.15 },
      { when: dated('2027-01-01'), price: 0.3 },
      { when: { time: [['22:00', '06:00']] }, price: 0.12 },
      'not a rule',
    ];
    const tariff = {
      tariff_version: 1,
      components: [{ key: 'energy', kind: 'consumption', rules, fallback: { price: 0.2 } }],
    };
    const pruned = pruneTariffToValidity(tariff, { valid_from: '2025-06-01', valid_to: '2026-12-31' });
    expect(pruned.components[0].rules).to.deep.equal([rules[2], rules[4], rules[5]]);
    expect(pruned.components[0].fallback).to.deep.equal({ price: 0.2 });
    // the input is left untouched
    expect(tariff.components[0].rules).to.have.lengthOf(6);
  });

  it('should drop the fixed and demand components dated outside the validity, and the taxes left empty', () => {
    const tariff = {
      tariff_version: 1,
      components: [
        { key: 'energy', kind: 'consumption', fallback: { price: 0.2 } },
        { key: 'subscription', kind: 'fixed', amount: 19.88, per: 'month' },
        { key: 'subscription-2024', kind: 'fixed', amount: 18, per: 'month', when: dated('2024-01-01', '2024-12-31') },
        { key: 'demand-2024', kind: 'demand', price: 5, per: 'month', when: dated('2024-01-01', '2024-12-31') },
        { key: 'vat', kind: 'tax', rate: 0.2, applies_to: ['energy', 'subscription-2024'] },
        { key: 'old-tax', kind: 'tax', rate: 0.05, applies_to: ['subscription-2024', 'demand-2024'] },
        { key: 'tax-of-old-tax', kind: 'tax', rate: 0.01, applies_to: ['old-tax'] },
        { key: 'broken-tax', kind: 'tax', rate: 0.01 },
        null,
      ],
    };
    const pruned = pruneTariffToValidity(tariff, { valid_from: '2026-10-01' });
    expect(pruned.components).to.deep.equal([
      tariff.components[0],
      tariff.components[1],
      { key: 'vat', kind: 'tax', rate: 0.2, applies_to: ['energy'] },
      tariff.components[7],
      null,
    ]);
  });

  it('should keep the parts overlapping one of several windows', () => {
    const tariff = {
      tariff_version: 1,
      components: [
        { key: 'energy', kind: 'consumption', fallback: { price: 0.2 } },
        { key: 'sub-2008', kind: 'fixed', amount: 10, per: 'month', when: dated('2008-01-01', '2008-12-31') },
        { key: 'sub-2015', kind: 'fixed', amount: 10, per: 'month', when: dated('2015-01-01', '2015-12-31') },
        { key: 'sub-2026', kind: 'fixed', amount: 10, per: 'month', when: dated('2026-01-01') },
      ],
    };
    const pruned = pruneTariffToValidity(tariff, [
      { valid_from: '2006-01-01', valid_to: '2010-12-31' },
      { valid_from: '2026-01-12', valid_to: '2026-01-12' },
    ]);
    expect(pruned.components.map((c) => c.key)).to.deep.equal(['energy', 'sub-2008', 'sub-2026']);
  });

  it('should return the tariff itself when nothing is outside the validity or it is malformed', () => {
    const tariff = {
      tariff_version: 1,
      components: [
        { key: 'energy', kind: 'consumption', rules: [{ when: dated('2026-01-01'), price: 0.1 }] },
        { key: 'energy-2', kind: 'consumption' },
        { key: 'subscription', kind: 'fixed', amount: 12, per: 'month', when: dated('2026-01-01') },
        { key: 'vat', kind: 'tax', rate: 0.2, applies_to: ['energy'] },
      ],
    };
    expect(pruneTariffToValidity(tariff, { valid_from: '2026-10-01' })).to.equal(tariff);
    expect(pruneTariffToValidity(tariff)).to.equal(tariff);
    expect(pruneTariffToValidity(null, { valid_from: '2026-10-01' })).to.equal(null);
    const noComponents = { tariff_version: 1 };
    expect(pruneTariffToValidity(noComponents, { valid_from: '2026-10-01' })).to.equal(noComponents);
  });
});
