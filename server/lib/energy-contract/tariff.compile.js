const { BadParameters } = require('../../utils/coreErrors');
const { validateTariff } = require('./tariff.validate');
const { TARIFF_COMPONENT_KINDS, TARIFF_WEEKDAYS, INPUT_PLACEHOLDER_REGEX } = require('./tariff.constants');
const { compileTimeIntervals, parseMonthDay } = require('./tariff.time');

const EXACT_PLACEHOLDER_REGEX = /^\{\{input:([a-z0-9_]+)\}\}$/;
// JavaScript day index of each ISO weekday name (0 = Sunday).
const WEEKDAY_INDEXES = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };

/**
 * @description Replace the {{input:<key>}} placeholders of a template with the
 * user's inputs: a string that is exactly a placeholder takes the input value
 * whatever its type (a number, an array of time intervals), a placeholder inside
 * a longer string is replaced by its text.
 * @param {*} node - Any JSON value.
 * @param {object} inputs - Input values by key.
 * @returns {*} A deep copy with the placeholders substituted.
 * @example
 * substituteInputs({ time: '{{input:slots}}' }, { slots: [['22:00', '06:00']] });
 */
function substituteInputs(node, inputs) {
  if (typeof node === 'string') {
    const exact = node.match(EXACT_PLACEHOLDER_REGEX);
    if (exact) {
      if (!Object.prototype.hasOwnProperty.call(inputs, exact[1])) {
        throw new BadParameters(`tariff: missing input "${exact[1]}"`);
      }
      return inputs[exact[1]];
    }
    return node.replace(INPUT_PLACEHOLDER_REGEX, (match, key) => {
      if (!Object.prototype.hasOwnProperty.call(inputs, key)) {
        throw new BadParameters(`tariff: missing input "${key}"`);
      }
      return String(inputs[key]);
    });
  }
  if (Array.isArray(node)) {
    return node.map((item) => substituteInputs(item, inputs));
  }
  if (node !== null && typeof node === 'object') {
    const copy = {};
    Object.keys(node).forEach((key) => {
      copy[key] = substituteInputs(node[key], inputs);
    });
    return copy;
  }
  return node;
}

/**
 * @description Compile a calendar condition into a set of string values per calendar key.
 * @param {object} condition - The condition, a value or a list of values per calendar key.
 * @returns {object} The compiled condition.
 * @example
 * compileCalendarCondition({ tempo: ['red', 'white'] });
 */
function compileCalendarCondition(condition) {
  const compiled = {};
  Object.keys(condition).forEach((key) => {
    const values = Array.isArray(condition[key]) ? condition[key] : [condition[key]];
    compiled[key] = new Set(values.map((value) => String(value)));
  });
  return compiled;
}

/**
 * @description Precompute the conditions of a rule (minutes, day indexes, MMDD numbers, sets).
 * @param {object} when - Validated conditions.
 * @returns {object|undefined} The compiled conditions, undefined when there are none.
 * @example
 * compileConditions({ time: [['22:00', '06:00']], weekdays: ['sat', 'sun'] });
 */
function compileConditions(when) {
  if (when === undefined) {
    return undefined;
  }
  const compiled = {};
  if (when.time !== undefined) {
    compiled.time = compileTimeIntervals(when.time);
  }
  if (when.weekdays !== undefined) {
    compiled.weekdays = new Set(when.weekdays.map((name) => WEEKDAY_INDEXES[name]));
  }
  if (when.months !== undefined) {
    compiled.months = new Set(when.months);
  }
  if (when.season !== undefined) {
    compiled.season = { from: parseMonthDay(when.season.from), to: parseMonthDay(when.season.to) };
  }
  if (when.dates !== undefined) {
    compiled.dates = { from: when.dates.from, to: when.dates.to };
  }
  if (when.calendar !== undefined) {
    compiled.calendar = compileCalendarCondition(when.calendar);
  }
  if (when.not_calendar !== undefined) {
    compiled.not_calendar = compileCalendarCondition(when.not_calendar);
  }
  if (when.tier !== undefined) {
    compiled.tier = {
      cumulative: when.tier.cumulative,
      from_kwh: when.tier.from_kwh,
      to_kwh: when.tier.to_kwh === undefined ? Infinity : when.tier.to_kwh,
    };
  }
  if (when.power_threshold !== undefined) {
    compiled.power_threshold = { above_kw: when.power_threshold.above_kw };
  }
  return compiled;
}

/**
 * @description Compile a price spec (rule or fallback): a fixed price, or a calendar price × multiplier + offset.
 * @param {object} spec - Validated rule or fallback.
 * @returns {object} The compiled spec { label, price, price_from_calendar, multiplier, offset }.
 * @example
 * compilePriceSpec({ price_from_calendar: 'spot-fr', multiplier: 1.1, offset: 0.02 });
 */
function compilePriceSpec(spec) {
  return {
    label: spec.label,
    price: spec.price,
    price_from_calendar: spec.price_from_calendar,
    multiplier: spec.multiplier === undefined ? 1 : spec.multiplier,
    offset: spec.offset === undefined ? 0 : spec.offset,
  };
}

/**
 * @description Compile a tariff definition once per run: substitute the inputs,
 * validate the result, and turn every condition into its numeric form so the
 * engine evaluates thousands of intervals without parsing anything.
 * @param {object} tariff - Tariff definition (template or stored JSON).
 * @param {object} [inputs] - Values of the template inputs.
 * @returns {object} The compiled tariff: tariff, calendars, components, hasTier, tierScopes, needsPower.
 * @example
 * const compiled = compileTariff(template.tariff, { subscribed_power: 9 });
 */
function compileTariff(tariff, inputs = {}) {
  const normalized = validateTariff(substituteInputs(tariff, inputs));
  const tierScopes = new Set();
  // demand charges and power thresholds read the peak power of the intervals
  let needsPower = false;
  const components = normalized.components.map((component) => {
    if (component.kind === TARIFF_COMPONENT_KINDS.DEMAND) {
      needsPower = true;
    }
    if (component.kind === TARIFF_COMPONENT_KINDS.CONSUMPTION) {
      const rules = component.rules.map((r) => {
        const when = compileConditions(r.when);
        if (when !== undefined && when.tier !== undefined) {
          tierScopes.add(when.tier.cumulative);
        }
        if (when !== undefined && when.power_threshold !== undefined) {
          needsPower = true;
        }
        return { ...compilePriceSpec(r), when };
      });
      return {
        key: component.key,
        kind: component.kind,
        label: component.label,
        rules,
        fallback: component.fallback === undefined ? undefined : compilePriceSpec(component.fallback),
      };
    }
    if (component.kind === TARIFF_COMPONENT_KINDS.TAX) {
      return {
        key: component.key,
        kind: component.kind,
        label: component.label,
        rate: component.rate,
        applies_to: component.applies_to,
      };
    }
    // fixed and demand share the period conditions
    return { ...component, when: compileConditions(component.when) };
  });
  return {
    tariff: normalized,
    calendars: normalized.calendars,
    components,
    hasTier: tierScopes.size > 0,
    tierScopes: Array.from(tierScopes),
    needsPower,
  };
}

module.exports = {
  substituteInputs,
  compileConditions,
  compileTariff,
  WEEKDAY_INDEXES,
  TARIFF_WEEKDAYS,
};
