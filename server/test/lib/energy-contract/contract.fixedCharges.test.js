const { expect } = require('chai');
const { computeFixedCharges, findContractAt } = require('../../../lib/energy-contract/contract.fixedCharges');

const contract = (overrides = {}) => ({
  id: 'c1',
  name: 'Base',
  timezone: 'UTC',
  valid_from: '2026-01-01',
  valid_to: null,
  billing_period_start_day: 1,
  inputs: null,
  tariff: {
    tariff_version: 1,
    components: [
      { key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } },
      // 31 per month: 1 per day in January
      { key: 'sub', kind: 'fixed', amount: 31, per: 'month' },
    ],
  },
  ...overrides,
});
const period = (starts, ends) => ({ starts_at: starts, ends_at: ends });

describe('energy-contract computeFixedCharges', () => {
  it('should charge the fixed components of the active contract over each period', () => {
    const results = computeFixedCharges(
      [contract()],
      [
        period('2026-01-10T00:00:00.000Z', '2026-01-11T00:00:00.000Z'),
        period('2026-01-10T12:00:00.000Z', '2026-01-11T12:00:00.000Z'), // straddles a local midnight
        period('2026-01-10T00:00:00.000Z', '2026-01-10T01:00:00.000Z'),
      ],
    );
    expect(results).to.deep.equal([
      { starts_at: '2026-01-10T00:00:00.000Z', ends_at: '2026-01-11T00:00:00.000Z', value: 1, contract_name: 'Base' },
      { starts_at: '2026-01-10T12:00:00.000Z', ends_at: '2026-01-11T12:00:00.000Z', value: 1, contract_name: 'Base' },
      {
        starts_at: '2026-01-10T00:00:00.000Z',
        ends_at: '2026-01-10T01:00:00.000Z',
        value: Math.round((1 / 24) * 1e6) / 1e6,
        contract_name: 'Base',
      },
    ]);
  });

  it('should return nothing without a fixed component or without periods', () => {
    const energyOnly = contract({
      tariff: {
        tariff_version: 1,
        components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } }],
      },
    });
    expect(
      computeFixedCharges([energyOnly], [period('2026-01-10T00:00:00.000Z', '2026-01-11T00:00:00.000Z')]),
    ).to.deep.equal([]);
    expect(computeFixedCharges([], [period('2026-01-10T00:00:00.000Z', '2026-01-11T00:00:00.000Z')])).to.deep.equal([]);
    expect(computeFixedCharges([contract()], [])).to.deep.equal([]);
  });

  it('should charge nothing outside every contract and switch contract at its local midnight', () => {
    const old = contract({
      id: 'old',
      name: 'Old',
      timezone: 'Europe/Paris',
      valid_from: '2025-01-01',
      valid_to: '2026-01-10',
    });
    const recent = contract({
      id: 'new',
      name: 'New',
      timezone: 'Europe/Paris',
      valid_from: '2026-01-12',
      tariff: { tariff_version: 1, components: [{ key: 'sub', kind: 'fixed', amount: 62, per: 'month' }] },
    });
    // given unsorted: the most recent contract wins where they would overlap
    const results = computeFixedCharges(
      [recent, old],
      [
        period('2026-01-09T00:00:00.000Z', '2026-01-10T00:00:00.000Z'), // old only
        period('2026-01-10T00:00:00.000Z', '2026-01-11T00:00:00.000Z'), // old until 23:00 UTC, then nothing
        period('2026-01-11T00:00:00.000Z', '2026-01-12T00:00:00.000Z'), // nothing until 23:00 UTC, then new
        period('2026-01-10T23:00:00.000Z', '2026-01-11T23:00:00.000Z'), // exactly the gap
        period('2026-01-12T00:00:00.000Z', '2026-01-13T00:00:00.000Z'), // new only
      ],
    );
    expect(results.map((r) => [r.value, r.contract_name])).to.deep.equal([
      [1, 'Old'],
      [Math.round((23 / 24) * 1e6) / 1e6, 'Old'],
      [Math.round((2 / 24) * 1e6) / 1e6, 'New'],
      [0, null],
      [2, 'New'],
    ]);
    // a contract no period reaches prices nothing
    expect(
      computeFixedCharges([recent, old], [period('2026-01-09T00:00:00.000Z', '2026-01-10T00:00:00.000Z')]).map((r) => [
        r.value,
        r.contract_name,
      ]),
    ).to.deep.equal([[1, 'Old']]);
  });

  it('should apply the taxes on the fixed components only and honour their period conditions', () => {
    const taxed = contract({
      tariff: {
        tariff_version: 1,
        components: [
          { key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } },
          { key: 'sub', kind: 'fixed', amount: 31, per: 'month' },
          { key: 'winter', kind: 'fixed', amount: 31, per: 'month', when: { months: [12, 1, 2] } },
          { key: 'peak', kind: 'demand', price: 5, per: 'month' },
          { key: 'vat', kind: 'tax', rate: 10, applies_to: ['energy', 'sub', 'winter', 'peak'] },
        ],
      },
    });
    const results = computeFixedCharges(
      [taxed],
      [
        period('2026-01-10T00:00:00.000Z', '2026-01-11T00:00:00.000Z'),
        period('2026-03-10T00:00:00.000Z', '2026-03-11T00:00:00.000Z'),
      ],
    );
    // January: sub 1 + winter 1, plus 10 % on them; March: sub 1 only, plus 10 %
    expect(results.map((r) => r.value)).to.deep.equal([2.2, 1.1]);
  });

  it('should find the contract active at an instant in its own timezone', () => {
    const c = contract({ timezone: 'Europe/Paris', valid_from: '2026-01-10', valid_to: '2026-01-10' });
    expect(findContractAt([c], new Date('2026-01-09T23:30:00.000Z').getTime())).to.equal(c);
    expect(findContractAt([c], new Date('2026-01-10T23:30:00.000Z').getTime())).to.equal(undefined);
    expect(findContractAt([], Date.now())).to.equal(undefined);
  });
});
