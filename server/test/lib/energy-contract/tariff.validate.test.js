const { expect } = require('chai');
const { validateTariff, formatPath } = require('../../../lib/energy-contract/tariff.validate');
const { BadParameters } = require('../../../utils/coreErrors');

const base = (components, calendars) => ({ tariff_version: 1, calendars, components });
const consumption = (extra = {}) => ({ key: 'energy', kind: 'consumption', fallback: { price: 0.25 }, ...extra });

const expectError = (tariff, messagePart) => {
  let caught;
  try {
    validateTariff(tariff);
  } catch (e) {
    caught = e;
  }
  expect(caught, `expected a BadParameters error containing "${messagePart}"`).to.be.instanceOf(BadParameters);
  expect(caught.message).to.include(messagePart);
};

describe('energy-contract validateTariff', () => {
  it('should accept a complete tariff and apply the defaults', () => {
    const tariff = validateTariff(
      base(
        [
          {
            key: 'energy',
            kind: 'consumption',
            label: 'Energy',
            rules: [
              { label: 'Red peak', when: { calendar: { tempo: 'red' }, time: [['06:00', '22:00']] }, price: 0.7562 },
              { when: { not_calendar: { holidays: ['holiday', 1] } }, price_from_calendar: 'spot', multiplier: 1.1 },
              { when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 40 }, weekdays: ['sat', 'sun'] }, price: 0.1 },
              {
                when: { season: { from: '11-01', to: '03-31' }, months: [1], dates: { from: '2026-01-01' } },
                price: 0.2,
              },
              { when: { power_threshold: { above_kw: 6 } }, price: 0.3 },
            ],
            fallback: { price_from_calendar: 'spot', offset: 0.02 },
          },
          { key: 'sub', kind: 'fixed', amount: 17.11, per: 'month', when: { months: [1, 2] } },
          { key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy', 'sub'] },
          {
            key: 'peak',
            kind: 'demand',
            price: 3,
            per: 'billing_period',
            when: { season: { from: '06-01', to: '09-30' } },
          },
        ],
        ['tempo', 'holidays', 'spot'],
      ),
    );
    expect(tariff.components[3].aggregation).to.equal('max');
    expect(tariff.components[0].rules).to.have.lengthOf(5);
  });
  it('should default calendars and rules', () => {
    const tariff = validateTariff(base([consumption()]));
    expect(tariff.calendars).to.deep.equal([]);
    expect(tariff.components[0].rules).to.deep.equal([]);
  });
  it('should accept a consumption component whose last rule has no when', () => {
    const tariff = validateTariff(
      base([
        {
          key: 'energy',
          kind: 'consumption',
          rules: [{ when: { time: [['22:00', '06:00']] }, price: 0.1 }, { price: 0.2 }],
        },
      ]),
    );
    expect(tariff.components[0].fallback).to.equal(undefined);
  });
  it('should reject a wrong tariff version with its path', () => {
    expectError({ tariff_version: 2, components: [consumption()] }, 'tariff.tariff_version: must be [1]');
  });
  it('should reject a missing components array', () => {
    expectError({ tariff_version: 1 }, 'tariff.components: is required');
  });
  it('should reject an unknown component kind', () => {
    expectError(
      base([{ key: 'e', kind: 'magic' }]),
      'tariff.components[0].kind: must be one of [consumption, fixed, tax, demand]',
    );
  });
  it('should reject an unknown key', () => {
    expectError(base([consumption({ foo: 1 })]), 'tariff.components[0].foo: is not allowed');
  });
  it('should reject a consumption component without fallback nor catch-all rule', () => {
    expectError(
      base([{ key: 'e', kind: 'consumption', rules: [{ when: { time: [['06:00', '22:00']] }, price: 0.1 }] }]),
      'tariff.components[0]: a consumption component needs a fallback or a last rule without "when"',
    );
    expectError(base([{ key: 'e', kind: 'consumption' }]), 'needs a fallback');
  });
  it('should reject a price spec with both price and price_from_calendar', () => {
    expectError(
      base([consumption({ fallback: { price: 1, price_from_calendar: 'spot' } })], ['spot']),
      'tariff.components[0].fallback',
    );
  });
  it('should reject multiplier or offset without price_from_calendar', () => {
    expectError(base([consumption({ fallback: { price: 1, offset: 0.1 } })]), 'tariff.components[0].fallback: ');
    expectError(base([consumption({ fallback: { price: 1, multiplier: 2 } })]), 'tariff.components[0].fallback: ');
  });
  it('should reject a negative price and an invalid tier', () => {
    expectError(
      base([consumption({ fallback: { price: -1 } })]),
      'tariff.components[0].fallback.price: must be greater than or equal to 0',
    );
    expectError(
      base([consumption({ rules: [{ when: { tier: { cumulative: 'day', from_kwh: 5, to_kwh: 2 } }, price: 1 }] })]),
      'tariff.components[0].rules[0].when.tier.to_kwh',
    );
    expectError(
      base([consumption({ rules: [{ when: { tier: { cumulative: 'week', from_kwh: 0 } }, price: 1 }] })]),
      'tariff.components[0].rules[0].when.tier.cumulative',
    );
  });
  it('should reject malformed time, weekday, month, season and date conditions', () => {
    expectError(base([consumption({ rules: [{ when: { time: [['6:00', '22:00']] }, price: 1 }] })]), 'when.time[0][0]');
    expectError(base([consumption({ rules: [{ when: { time: [['06:00']] }, price: 1 }] })]), 'when.time[0]');
    expectError(
      base([consumption({ rules: [{ when: { time: [['24:30', '06:00']] }, price: 1 }] })]),
      'when.time[0][0]',
    );
    expect(() =>
      validateTariff(base([consumption({ rules: [{ when: { time: [['22:00', '24:00']] }, price: 1 }] })])),
    ).to.not.throw();
    expectError(base([consumption({ rules: [{ when: { weekdays: ['monday'] }, price: 1 }] })]), 'when.weekdays[0]');
    expectError(base([consumption({ rules: [{ when: { weekdays: ['mon', 'mon'] }, price: 1 }] })]), 'when.weekdays[1]');
    expectError(base([consumption({ rules: [{ when: { months: [13] }, price: 1 }] })]), 'when.months[0]');
    expectError(
      base([consumption({ rules: [{ when: { season: { from: '13-01', to: '03-31' } }, price: 1 }] })]),
      'when.season.from',
    );
    expectError(
      base([consumption({ rules: [{ when: { dates: { from: '2026/01/01' } }, price: 1 }] })]),
      'when.dates.from',
    );
    expectError(base([consumption({ rules: [{ when: {}, price: 1 }] })]), 'when: must have at least 1 key');
  });
  it('should reject an undeclared calendar in a rule, a not_calendar condition or a fallback', () => {
    expectError(
      base([consumption({ rules: [{ when: { calendar: { tempo: 'red' } }, price: 1 }] })]),
      'tariff.components[0].rules[0].when.calendar.tempo: calendar "tempo" is not declared in tariff.calendars',
    );
    expectError(
      base([consumption({ rules: [{ when: { not_calendar: { holidays: 'holiday' } }, price: 1 }] })], ['tempo']),
      'tariff.components[0].rules[0].when.not_calendar.holidays: calendar "holidays" is not declared',
    );
    expectError(
      base([consumption({ rules: [{ when: { time: [['00:00', '12:00']] }, price_from_calendar: 'spot' }] })]),
      'tariff.components[0].rules[0].price_from_calendar: calendar "spot" is not declared',
    );
    expectError(
      base([consumption({ fallback: { price_from_calendar: 'spot' } })]),
      'tariff.components[0].fallback.price_from_calendar: calendar "spot" is not declared',
    );
  });
  it('should reject an invalid calendar key or too many calendars', () => {
    expectError(base([consumption()], ['Tempo']), 'tariff.calendars[0]');
    expectError(
      base([consumption()], ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']),
      'tariff.calendars: must contain less than or equal to 8 items',
    );
  });
  it('should reject duplicate component keys', () => {
    expectError(
      base([consumption(), { key: 'energy', kind: 'fixed', amount: 1, per: 'day' }]),
      'tariff.components[1].key: component key "energy" is used twice',
    );
  });
  it('should reject a tax applying to a component declared after it or unknown', () => {
    expectError(
      base([{ key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy'] }, consumption()]),
      'tariff.components[0].applies_to[0]: component "energy" must be declared before the tax that applies to it',
    );
    expectError(
      base([consumption(), { key: 'vat', kind: 'tax', rate: 20, applies_to: [] }]),
      'tariff.components[1].applies_to',
    );
  });
  it('should reject malformed fixed and demand components', () => {
    expectError(
      base([consumption(), { key: 'sub', kind: 'fixed', amount: 1, per: 'week' }]),
      'tariff.components[1].per',
    );
    expectError(
      base([consumption(), { key: 'sub', kind: 'fixed', per: 'day' }]),
      'tariff.components[1].amount: is required',
    );
    expectError(
      base([consumption(), { key: 'sub', kind: 'fixed', amount: 1, per: 'day', when: { time: [['00:00', '12:00']] } }]),
      'tariff.components[1].when.time: is not allowed',
    );
    expectError(base([consumption(), { key: 'd', kind: 'demand', price: 1, per: 'day' }]), 'tariff.components[1].per');
    expectError(
      base([consumption(), { key: 'd', kind: 'demand', price: 1, per: 'month', aggregation: 'median' }]),
      'tariff.components[1].aggregation',
    );
  });
  it('should reject too many components or rules', () => {
    const many = Array.from({ length: 17 }, (_, i) => ({ key: `c${i}`, kind: 'fixed', amount: 1, per: 'day' }));
    expectError(base(many), 'tariff.components: must contain less than or equal to 16 items');
    const rules = Array.from({ length: 65 }, () => ({ price: 1 }));
    expectError(
      base([consumption({ rules })]),
      'tariff.components[0].rules: must contain less than or equal to 64 items',
    );
  });
  it('should reject a non-object tariff', () => {
    expectError(undefined, 'tariff: is required');
    expectError('tariff', 'tariff: must be of type object');
  });
  it('should format Joi paths as JSON paths', () => {
    expect(formatPath([])).to.equal('');
    expect(formatPath(['components', 0, 'rules', 1, 'price'])).to.equal('components[0].rules[1].price');
  });
});
