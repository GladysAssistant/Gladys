const Joi = require('joi');
const { BadParameters } = require('../../utils/coreErrors');
const {
  TARIFF_VERSION,
  TARIFF_COMPONENT_KINDS,
  TARIFF_FIXED_PERIODS,
  TARIFF_CUMULATIVE_SCOPES,
  TARIFF_DEMAND_PERIODS,
  TARIFF_DEMAND_AGGREGATIONS,
  TARIFF_WEEKDAYS,
  CALENDAR_KEY_REGEX,
  COMPONENT_KEY_REGEX,
  TIME_REGEX,
  TIME_START_REGEX,
  MONTH_DAY_REGEX,
  DATE_REGEX,
  TARIFF_LIMITS,
} = require('./tariff.constants');

// Joi mirror of tariff.schema.json (the ecosystem's JSON Schema): the two must
// move together, test/lib/energy-contract/tariff.schema.test.js checks the
// enumerated values.

const calendarKey = Joi.string().pattern(CALENDAR_KEY_REGEX);
const componentKey = Joi.string().pattern(COMPONENT_KEY_REGEX);
const label = Joi.string()
  .min(1)
  .max(TARIFF_LIMITS.MAX_LABEL_LENGTH);
const time = Joi.string().pattern(TIME_REGEX);
const timeStart = Joi.string().pattern(TIME_START_REGEX);
const monthDay = Joi.string().pattern(MONTH_DAY_REGEX);
const date = Joi.string().pattern(DATE_REGEX);
const calendarValue = Joi.alternatives().try(Joi.string().max(64), Joi.number());
const calendarCondition = Joi.object()
  .pattern(
    CALENDAR_KEY_REGEX,
    Joi.alternatives().try(
      calendarValue,
      Joi.array()
        .items(calendarValue)
        .min(1)
        .max(TARIFF_LIMITS.MAX_CALENDAR_VALUES),
    ),
  )
  .min(1)
  .max(TARIFF_LIMITS.MAX_CALENDARS);

const periodConditionFields = {
  weekdays: Joi.array()
    .items(Joi.string().valid(...TARIFF_WEEKDAYS))
    .unique()
    .min(1)
    .max(7),
  months: Joi.array()
    .items(
      Joi.number()
        .integer()
        .min(1)
        .max(12),
    )
    .unique()
    .min(1)
    .max(12),
  season: Joi.object({ from: monthDay.required(), to: monthDay.required() }),
  dates: Joi.object({ from: date.required(), to: date }),
};

const conditions = Joi.object({
  time: Joi.array()
    .items(
      Joi.array()
        .ordered(timeStart, time)
        .length(2),
    )
    .min(1)
    .max(TARIFF_LIMITS.MAX_TIME_INTERVALS),
  ...periodConditionFields,
  calendar: calendarCondition,
  not_calendar: calendarCondition,
  tier: Joi.object({
    cumulative: Joi.string()
      .valid(...Object.values(TARIFF_CUMULATIVE_SCOPES))
      .required(),
    from_kwh: Joi.number()
      .min(0)
      .required(),
    to_kwh: Joi.number().greater(Joi.ref('from_kwh')),
  }),
  power_threshold: Joi.object({
    above_kw: Joi.number()
      .min(0)
      .required(),
  }),
}).min(1);

const periodConditions = Joi.object(periodConditionFields).min(1);

const priceSpecFields = {
  price: Joi.number().min(0),
  price_from_calendar: calendarKey,
  multiplier: Joi.number().min(0),
  offset: Joi.number(),
};
const priceSpecRules = (schema) =>
  schema
    .xor('price', 'price_from_calendar')
    .with('multiplier', 'price_from_calendar')
    .with('offset', 'price_from_calendar');

const rule = priceSpecRules(Joi.object({ label, when: conditions, ...priceSpecFields }));
const fallback = priceSpecRules(Joi.object({ label, ...priceSpecFields }));

const consumptionComponent = Joi.object({
  key: componentKey.required(),
  kind: Joi.string()
    .valid(TARIFF_COMPONENT_KINDS.CONSUMPTION)
    .required(),
  label,
  rules: Joi.array()
    .items(rule)
    .max(TARIFF_LIMITS.MAX_RULES_PER_COMPONENT)
    .default([]),
  fallback,
});

const fixedComponent = Joi.object({
  key: componentKey.required(),
  kind: Joi.string()
    .valid(TARIFF_COMPONENT_KINDS.FIXED)
    .required(),
  label,
  amount: Joi.number()
    .min(0)
    .required(),
  per: Joi.string()
    .valid(...Object.values(TARIFF_FIXED_PERIODS))
    .required(),
  when: periodConditions,
});

const taxComponent = Joi.object({
  key: componentKey.required(),
  kind: Joi.string()
    .valid(TARIFF_COMPONENT_KINDS.TAX)
    .required(),
  label,
  rate: Joi.number()
    .min(0)
    .required(),
  applies_to: Joi.array()
    .items(componentKey)
    .unique()
    .min(1)
    .max(TARIFF_LIMITS.MAX_COMPONENTS)
    .required(),
});

const demandComponent = Joi.object({
  key: componentKey.required(),
  kind: Joi.string()
    .valid(TARIFF_COMPONENT_KINDS.DEMAND)
    .required(),
  label,
  price: Joi.number()
    .min(0)
    .required(),
  per: Joi.string()
    .valid(...Object.values(TARIFF_DEMAND_PERIODS))
    .required(),
  aggregation: Joi.string()
    .valid(...Object.values(TARIFF_DEMAND_AGGREGATIONS))
    .default(TARIFF_DEMAND_AGGREGATIONS.MAX),
  when: periodConditions,
});

const component = Joi.alternatives()
  .conditional('.kind', {
    switch: [
      { is: TARIFF_COMPONENT_KINDS.CONSUMPTION, then: consumptionComponent },
      { is: TARIFF_COMPONENT_KINDS.FIXED, then: fixedComponent },
      { is: TARIFF_COMPONENT_KINDS.TAX, then: taxComponent },
      { is: TARIFF_COMPONENT_KINDS.DEMAND, then: demandComponent },
    ],
    otherwise: Joi.object({
      key: componentKey.required(),
      kind: Joi.string()
        .valid(...Object.values(TARIFF_COMPONENT_KINDS))
        .required(),
    }).unknown(true),
  })
  .required();

const tariffSchema = Joi.object({
  tariff_version: Joi.number()
    .valid(TARIFF_VERSION)
    .required(),
  calendars: Joi.array()
    .items(calendarKey)
    .unique()
    .max(TARIFF_LIMITS.MAX_CALENDARS)
    .default([]),
  components: Joi.array()
    .items(component)
    .min(1)
    .max(TARIFF_LIMITS.MAX_COMPONENTS)
    .required(),
}).required();

/**
 * @description Format a Joi path as a JSON path (`components[0].rules[1].price`).
 * @param {Array<string|number>} path - Joi path segments.
 * @returns {string} The JSON path, empty for the root.
 * @example
 * formatPath(['components', 0, 'price']); // 'components[0].price'
 */
function formatPath(path) {
  return path.reduce((acc, segment) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }
    return acc === '' ? segment : `${acc}.${segment}`;
  }, '');
}

/**
 * @description Build the BadParameters error of a tariff validation failure.
 * @param {Array<string|number>} path - Path of the invalid value.
 * @param {string} message - What is wrong.
 * @returns {BadParameters} The error, whose message carries the JSON path.
 * @example
 * throw tariffError(['components', 0], 'needs a fallback');
 */
function tariffError(path, message) {
  const jsonPath = formatPath(path);
  return new BadParameters(`tariff${jsonPath === '' ? '' : `.${jsonPath}`}: ${message}`);
}

/**
 * @description Collect the calendar keys a price spec or a condition set references.
 * @param {object} rulePath - Path of the rule (for error messages).
 * @param {object} spec - Rule or fallback (price spec + optional when).
 * @param {Array<string>} declared - Calendars declared by the tariff.
 * @returns {void} Throws on an undeclared calendar.
 * @example
 * checkCalendarReferences(['components', 0, 'rules', 0], rule, ['tempo']);
 */
function checkCalendarReferences(rulePath, spec, declared) {
  if (spec.price_from_calendar !== undefined && !declared.includes(spec.price_from_calendar)) {
    throw tariffError(
      [...rulePath, 'price_from_calendar'],
      `calendar "${spec.price_from_calendar}" is not declared in tariff.calendars`,
    );
  }
  ['calendar', 'not_calendar'].forEach((conditionKey) => {
    const condition = spec.when && spec.when[conditionKey];
    if (!condition) {
      return;
    }
    Object.keys(condition).forEach((key) => {
      if (!declared.includes(key)) {
        throw tariffError(
          [...rulePath, 'when', conditionKey, key],
          `calendar "${key}" is not declared in tariff.calendars`,
        );
      }
    });
  });
}

/**
 * @description Semantic checks Joi cannot express: unique component keys, tax
 * references, consumption fallback, declared calendars.
 * @param {object} tariff - Joi-validated tariff.
 * @returns {void} Throws BadParameters on the first violation.
 * @example
 * checkSemantics(tariff);
 */
function checkSemantics(tariff) {
  const seenKeys = [];
  tariff.components.forEach((comp, index) => {
    const path = ['components', index];
    if (seenKeys.includes(comp.key)) {
      throw tariffError([...path, 'key'], `component key "${comp.key}" is used twice`);
    }
    if (comp.kind === TARIFF_COMPONENT_KINDS.CONSUMPTION) {
      const lastRule = comp.rules[comp.rules.length - 1];
      const hasCatchAll = lastRule !== undefined && lastRule.when === undefined;
      if (comp.fallback === undefined && !hasCatchAll) {
        throw tariffError(path, 'a consumption component needs a fallback or a last rule without "when"');
      }
      comp.rules.forEach((r, ruleIndex) => checkCalendarReferences([...path, 'rules', ruleIndex], r, tariff.calendars));
      if (comp.fallback !== undefined) {
        checkCalendarReferences([...path, 'fallback'], comp.fallback, tariff.calendars);
      }
    }
    if (comp.kind === TARIFF_COMPONENT_KINDS.TAX) {
      comp.applies_to.forEach((key, keyIndex) => {
        if (!seenKeys.includes(key)) {
          throw tariffError(
            [...path, 'applies_to', keyIndex],
            `component "${key}" must be declared before the tax that applies to it`,
          );
        }
      });
    }
    seenKeys.push(comp.key);
  });
}

/**
 * @description Validate a tariff definition against the grammar of
 * docs/specs/energy-contracts.md (section 4) and return its normalized form
 * (defaults applied). Throws BadParameters with the JSON path of the first error.
 * @param {object} tariff - Tariff definition (JSON object).
 * @returns {object} The normalized tariff.
 * @example
 * validateTariff({ tariff_version: 1, components: [{ key: 'e', kind: 'consumption', fallback: { price: 0.25 } }] });
 */
function validateTariff(tariff) {
  const { error, value } = tariffSchema.validate(tariff, { abortEarly: true, convert: false });
  if (error) {
    const [detail] = error.details;
    throw tariffError(detail.path, detail.message.replace(/^"[^"]*" /, ''));
  }
  checkSemantics(value);
  return value;
}

module.exports = {
  validateTariff,
  formatPath,
};
