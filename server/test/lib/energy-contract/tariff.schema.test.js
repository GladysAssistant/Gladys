const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const constants = require('../../../lib/energy-contract/tariff.constants');
const { validateTariff } = require('../../../lib/energy-contract/tariff.validate');

// tariff.schema.json is the JSON Schema the ecosystem validates against
// (energy-contracts catalogue, store indexer, SDK); tariff.validate.js is its
// Joi mirror in the core. This test keeps every enumerated value and limit in
// sync, and runs both validators on a shared fixture pack: whatever the schema
// accepts and the core rejects is a semantic rule the schema description lists.
const schema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../lib/energy-contract/tariff.schema.json'), 'utf8'),
);
const consumption = (extra = {}) => ({ key: 'energy', kind: 'consumption', fallback: { price: 0.25 }, ...extra });
const base = (components, calendars) => ({ tariff_version: 1, calendars, components });

const VALID = {
  base: base([consumption()]),
  'catch-all rule': base([
    { key: 'e', kind: 'consumption', rules: [{ when: { time: [['22:00', '06:00']] }, price: 0.1 }, { price: 0.2 }] },
  ]),
  'every condition and component': base(
    [
      {
        key: 'energy',
        kind: 'consumption',
        label: 'Energy',
        rules: [
          { label: 'Red peak', when: { calendar: { tempo: 'red' }, time: [['06:00', '22:00']] }, price: 0.7562 },
          {
            when: { not_calendar: { holidays: ['holiday', 1] } },
            price_from_calendar: 'spot',
            multiplier: 1.1,
            offset: 0.02,
          },
          { when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 40 }, weekdays: ['sat', 'sun'] }, price: 0.1 },
          {
            when: {
              season: { from: '11-01', to: '03-31' },
              months: [1],
              dates: { from: '2026-01-01', to: '2026-12-31' },
            },
            price: 0.2,
          },
          { when: { power_threshold: { above_kw: 6 }, time: [['22:00', '24:00']] }, price: 0.3 },
        ],
        fallback: { label: 'Base', price_from_calendar: 'spot' },
      },
      { key: 'sub', kind: 'fixed', amount: 17.11, per: 'month', when: { months: [1, 2], weekdays: ['mon'] } },
      { key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy', 'sub'] },
      {
        key: 'peak',
        kind: 'demand',
        price: 3,
        per: 'billing_period',
        aggregation: 'top3_average',
        when: { season: { from: '06-01', to: '09-30' } },
      },
    ],
    ['tempo', 'holidays', 'spot'],
  ),
};

// Rejected by both validators.
const INVALID = {
  'wrong version': { tariff_version: 2, components: [consumption()] },
  'no components': { tariff_version: 1 },
  'empty components': base([]),
  'unknown kind': base([{ key: 'e', kind: 'magic' }]),
  'unknown key': base([consumption({ foo: 1 })]),
  'bad component key': base([consumption({ key: 'Energy!' })]),
  'price and calendar price': base([consumption({ fallback: { price: 1, price_from_calendar: 'spot' } })], ['spot']),
  'multiplier without calendar price': base([consumption({ fallback: { price: 1, multiplier: 2 } })]),
  'offset without calendar price': base([consumption({ rules: [{ price: 1, offset: 0.1 }] })]),
  'negative price': base([consumption({ fallback: { price: -1 } })]),
  'time 24:00 as a start': base([consumption({ rules: [{ when: { time: [['24:00', '06:00']] }, price: 1 }] })]),
  'time 24:30': base([consumption({ rules: [{ when: { time: [['24:30', '06:00']] }, price: 1 }] })]),
  'time 6:00': base([consumption({ rules: [{ when: { time: [['6:00', '22:00']] }, price: 1 }] })]),
  'time one bound': base([consumption({ rules: [{ when: { time: [['06:00']] }, price: 1 }] })]),
  'bad weekday': base([consumption({ rules: [{ when: { weekdays: ['monday'] }, price: 1 }] })]),
  'duplicate weekday': base([consumption({ rules: [{ when: { weekdays: ['mon', 'mon'] }, price: 1 }] })]),
  'month 13': base([consumption({ rules: [{ when: { months: [13] }, price: 1 }] })]),
  'bad season': base([consumption({ rules: [{ when: { season: { from: '13-01', to: '03-31' } }, price: 1 }] })]),
  'bad date': base([consumption({ rules: [{ when: { dates: { from: '2026/01/01' } }, price: 1 }] })]),
  'empty when': base([consumption({ rules: [{ when: {}, price: 1 }] })]),
  'bad cumulative': base([consumption({ rules: [{ when: { tier: { cumulative: 'week', from_kwh: 0 } }, price: 1 }] })]),
  'negative tier': base([consumption({ rules: [{ when: { tier: { cumulative: 'day', from_kwh: -1 } }, price: 1 }] })]),
  'calendar value too long': base(
    [consumption({ rules: [{ when: { calendar: { tempo: 'x'.repeat(65) } }, price: 1 }] })],
    ['tempo'],
  ),
  'bad calendar key': base([consumption()], ['Tempo']),
  'too many calendars': base([consumption()], ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']),
  'fixed bad period': base([consumption(), { key: 'sub', kind: 'fixed', amount: 1, per: 'week' }]),
  'fixed without amount': base([consumption(), { key: 'sub', kind: 'fixed', per: 'day' }]),
  'fixed with time condition': base([
    consumption(),
    { key: 'sub', kind: 'fixed', amount: 1, per: 'day', when: { time: [['00:00', '12:00']] } },
  ]),
  'tax without applies_to': base([consumption(), { key: 'vat', kind: 'tax', rate: 20 }]),
  'tax empty applies_to': base([consumption(), { key: 'vat', kind: 'tax', rate: 20, applies_to: [] }]),
  'demand bad period': base([consumption(), { key: 'd', kind: 'demand', price: 1, per: 'day' }]),
  'demand bad aggregation': base([
    consumption(),
    { key: 'd', kind: 'demand', price: 1, per: 'month', aggregation: 'median' },
  ]),
  'too many components': base(
    Array.from({ length: 17 }, (_, i) => ({ key: `c${i}`, kind: 'fixed', amount: 1, per: 'day' })),
  ),
  'too many rules': base([consumption({ rules: Array.from({ length: 65 }, () => ({ price: 1 })) })]),
};

// Accepted by the JSON Schema (syntactic contract), rejected by the core validator:
// the semantic rules listed in the schema description.
const SEMANTIC_ONLY = {
  'no fallback nor catch-all rule': base([
    { key: 'e', kind: 'consumption', rules: [{ when: { time: [['06:00', '22:00']] }, price: 0.1 }] },
  ]),
  'tier to_kwh below from_kwh': base([
    consumption({ rules: [{ when: { tier: { cumulative: 'day', from_kwh: 5, to_kwh: 2 } }, price: 1 }] }),
  ]),
  'duplicate component keys': base([consumption(), { key: 'energy', kind: 'fixed', amount: 1, per: 'day' }]),
  'tax before its component': base([{ key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy'] }, consumption()]),
  'undeclared calendar in a condition': base([
    consumption({ rules: [{ when: { calendar: { tempo: 'red' } }, price: 1 }] }),
  ]),
  'undeclared calendar price': base([consumption({ fallback: { price_from_calendar: 'spot' } })]),
};

describe('energy-contract tariff.schema.json', () => {
  const { definitions } = schema;
  const componentVariants = definitions.component.oneOf;
  const ajv = new Ajv({ strict: false, allErrors: false });
  const validateWithSchema = ajv.compile(schema);
  const coreAccepts = (tariff) => {
    try {
      validateTariff(tariff);
      return true;
    } catch (e) {
      return false;
    }
  };

  it('should mirror the constants of the Joi validator', () => {
    expect(schema.properties.tariff_version.const).to.equal(constants.TARIFF_VERSION);
    expect(definitions.component.properties.kind.enum).to.deep.equal(Object.values(constants.TARIFF_COMPONENT_KINDS));
    expect(definitions.conditions.properties.weekdays.items.enum).to.deep.equal(constants.TARIFF_WEEKDAYS);
    expect(definitions.conditions.properties.tier.properties.cumulative.enum).to.deep.equal(
      Object.values(constants.TARIFF_CUMULATIVE_SCOPES),
    );
    expect(componentVariants[1].properties.per.enum).to.deep.equal(Object.values(constants.TARIFF_FIXED_PERIODS));
    expect(componentVariants[3].properties.per.enum).to.deep.equal(Object.values(constants.TARIFF_DEMAND_PERIODS));
    expect(componentVariants[3].properties.aggregation.enum).to.deep.equal(
      Object.values(constants.TARIFF_DEMAND_AGGREGATIONS),
    );
    expect(componentVariants[3].properties.aggregation.default).to.equal(constants.TARIFF_DEMAND_AGGREGATIONS.MAX);
  });
  it('should mirror the patterns', () => {
    expect(definitions.calendarKey.pattern).to.equal(constants.CALENDAR_KEY_REGEX.source);
    expect(definitions.componentKey.pattern).to.equal(constants.COMPONENT_KEY_REGEX.source);
    expect(definitions.time.pattern).to.equal(constants.TIME_REGEX.source);
    expect(definitions.timeStart.pattern).to.equal(constants.TIME_START_REGEX.source);
    expect(definitions.monthDay.pattern).to.equal(constants.MONTH_DAY_REGEX.source);
    expect(definitions.date.pattern).to.equal(constants.DATE_REGEX.source);
    expect(definitions.calendarCondition.propertyNames.pattern).to.equal(constants.CALENDAR_KEY_REGEX.source);
  });
  it('should mirror the limits', () => {
    expect(schema.properties.components.maxItems).to.equal(constants.TARIFF_LIMITS.MAX_COMPONENTS);
    expect(schema.properties.calendars.maxItems).to.equal(constants.TARIFF_LIMITS.MAX_CALENDARS);
    expect(componentVariants[0].properties.rules.maxItems).to.equal(constants.TARIFF_LIMITS.MAX_RULES_PER_COMPONENT);
    expect(definitions.conditions.properties.time.maxItems).to.equal(constants.TARIFF_LIMITS.MAX_TIME_INTERVALS);
    expect(definitions.calendarCondition.maxProperties).to.equal(constants.TARIFF_LIMITS.MAX_CALENDARS);
    expect(definitions.calendarCondition.additionalProperties.oneOf[1].maxItems).to.equal(
      constants.TARIFF_LIMITS.MAX_CALENDAR_VALUES,
    );
    expect(definitions.label.maxLength).to.equal(constants.TARIFF_LIMITS.MAX_LABEL_LENGTH);
  });
  it('should accept the valid fixtures with both validators', () => {
    Object.keys(VALID).forEach((name) => {
      expect(validateWithSchema(VALID[name]), `schema: ${name}`).to.equal(true);
      expect(coreAccepts(VALID[name]), `core: ${name}`).to.equal(true);
    });
  });
  it('should reject the invalid fixtures with both validators', () => {
    Object.keys(INVALID).forEach((name) => {
      expect(validateWithSchema(INVALID[name]), `schema: ${name}`).to.equal(false);
      expect(coreAccepts(INVALID[name]), `core: ${name}`).to.equal(false);
    });
  });
  it('should leave only the documented semantic rules to the core validator', () => {
    Object.keys(SEMANTIC_ONLY).forEach((name) => {
      expect(validateWithSchema(SEMANTIC_ONLY[name]), `schema: ${name}`).to.equal(true);
      expect(coreAccepts(SEMANTIC_ONLY[name]), `core: ${name}`).to.equal(false);
    });
  });
});
