const {
  TARIFF_COMPONENT_KINDS,
  TARIFF_FIXED_PERIODS,
  TARIFF_CUMULATIVE_SCOPES,
  DEFAULT_INTERVAL_DURATION_MINUTES,
  COST_DECIMALS,
  CALENDAR_WARNING_REASONS,
} = require('./tariff.constants');
const { getLocalContext, getDayBounds, getMonthBounds, getBillingPeriodBounds } = require('./tariff.time');
const { matchesConditions } = require('./tariff.conditions');
const { computeDemandCharges } = require('./tariff.demand');
const { createCalendarLookup } = require('./calendar.lookup');

const SCOPES = Object.values(TARIFF_CUMULATIVE_SCOPES);
const EMPTY_LOOKUP = createCalendarLookup();

/**
 * @description Round a monetary amount to the engine precision.
 * @param {number} value - Amount.
 * @returns {number} The rounded amount.
 * @example
 * roundCost(0.1234567); // 0.123457
 */
function roundCost(value) {
  const factor = 10 ** COST_DECIMALS;
  return Math.round(value * factor) / factor;
}

/**
 * @description Milliseconds since the epoch of an interval start.
 * @param {Date|string|number} value - Date, ISO string or timestamp.
 * @returns {number} Milliseconds.
 * @example
 * toMs('2026-01-12T05:00:00Z');
 */
function toMs(value) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * @description Resolve the unit price of a compiled price spec for an interval.
 * @param {object} spec - Compiled rule or fallback.
 * @param {Function} getCalendarValue - Calendar reader for the interval.
 * @returns {number|undefined} Price per kWh, undefined when the calendar has no value.
 * @example
 * resolvePrice(rule, getCalendarValue);
 */
function resolvePrice(spec, getCalendarValue) {
  if (spec.price_from_calendar === undefined) {
    return spec.price;
  }
  const value = getCalendarValue(spec.price_from_calendar);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return value * spec.multiplier + spec.offset;
}

/**
 * @description Price the energy of one interval with a consumption component: the rules
 * are tried in order, a tier rule prices the share of the energy that falls in its tier
 * and leaves the rest to the following rules, the first non-tier match prices everything
 * left, the fallback prices whatever remains.
 * @param {object} component - Compiled consumption component.
 * @param {object} interval - Prepared interval.
 * @param {object} context - The interval context: local, getCalendarValue, maxPowerKw.
 * @param {object} cumulative - The kWh accumulated before this interval, per scope.
 * @param {Array<object>} warnings - Collector of the run's warnings.
 * @returns {object} The amount and the label of the rule that priced the last share.
 * @example
 * evaluateConsumption(component, interval, context, cumulative, warnings);
 */
function evaluateConsumption(component, interval, context, cumulative, warnings) {
  let remaining = interval.kwh;
  let offset = 0;
  let amount = 0;
  let label;
  const warn = (spec, reason) => {
    warnings.push({
      starts_at: interval.startsAt,
      component_key: component.key,
      calendar_key: spec === undefined ? undefined : spec.price_from_calendar,
      reason,
    });
  };
  const { rules } = component;
  // The first matching rule wins. When its calendar price is missing, the rest of
  // the energy goes to the fallback (with a warning), never to a later rule: a
  // later rule was never meant to price this interval.
  let stopped = false;
  for (let i = 0; i < rules.length && remaining > 0 && !stopped; i += 1) {
    const rule = rules[i];
    if (matchesConditions(rule.when, context)) {
      const tier = rule.when === undefined ? undefined : rule.when.tier;
      if (tier === undefined) {
        const price = resolvePrice(rule, context.getCalendarValue);
        if (price === undefined) {
          warn(rule, CALENDAR_WARNING_REASONS.CALENDAR_MISSING);
          stopped = true;
        } else {
          amount += price * remaining;
          remaining = 0;
          label = rule.label;
        }
      } else {
        const rangeStart = cumulative[tier.cumulative] + offset;
        const rangeEnd = cumulative[tier.cumulative] + interval.kwh;
        const share = Math.min(rangeEnd, tier.to_kwh) - Math.max(rangeStart, tier.from_kwh);
        if (share > 0) {
          const price = resolvePrice(rule, context.getCalendarValue);
          if (price === undefined) {
            warn(rule, CALENDAR_WARNING_REASONS.CALENDAR_MISSING);
            stopped = true;
          } else {
            amount += price * share;
            offset += share;
            remaining -= share;
            label = rule.label;
          }
        }
      }
    }
  }
  if (remaining > 0) {
    const price =
      component.fallback === undefined ? undefined : resolvePrice(component.fallback, context.getCalendarValue);
    if (price === undefined) {
      warn(component.fallback, CALENDAR_WARNING_REASONS.NO_PRICE);
    } else {
      amount += price * remaining;
      label = component.fallback.label;
    }
  }
  return { amount, label };
}

/**
 * @description Share of a fixed component (per day or per month) borne by an interval.
 * @param {object} component - Compiled fixed component.
 * @param {object} interval - Prepared interval.
 * @param {string} tz - Contract timezone.
 * @returns {number} The amount.
 * @example
 * evaluateFixed(component, interval, 'Europe/Paris');
 */
function evaluateFixed(component, interval, tz) {
  // period conditions (months, season, dates, weekdays) never read calendars nor power
  if (!matchesConditions(component.when, { local: interval.local, maxPowerKw: 0 })) {
    return 0;
  }
  const bounds =
    component.per === TARIFF_FIXED_PERIODS.DAY
      ? getDayBounds(interval.local.date, tz)
      : getMonthBounds(interval.local.date, tz);
  return (component.amount * interval.durationMinutes) / bounds.durationMinutes;
}

/**
 * @description Normalize the caller's intervals: instants, durations, peak power,
 * local context and the ids of the periods they belong to, sorted by start.
 * @param {Array<object>} intervals - [{ starts_at, kwh, max_power_kw?, duration_minutes? }].
 * @param {string} tz - Contract timezone.
 * @param {number} billingPeriodStartDay - Billing period start day (1-31).
 * @returns {Array<object>} Prepared intervals.
 * @example
 * prepareIntervals(intervals, 'Europe/Paris', 1);
 */
function prepareIntervals(intervals, tz, billingPeriodStartDay) {
  return intervals
    .map((interval) => {
      const ms = toMs(interval.starts_at);
      const durationMinutes = interval.duration_minutes || DEFAULT_INTERVAL_DURATION_MINUTES;
      const kwh = Number(interval.kwh) || 0;
      const local = getLocalContext(ms, tz);
      return {
        ms,
        startsAt: new Date(ms).toISOString(),
        kwh,
        durationMinutes,
        maxPowerKw:
          interval.max_power_kw === undefined || interval.max_power_kw === null
            ? (kwh * 60) / durationMinutes
            : Number(interval.max_power_kw),
        local,
        periodIds: {
          day: local.date,
          month: local.date.slice(0, 7),
          billing_period: getBillingPeriodBounds(local.date, billingPeriodStartDay, tz).id,
        },
      };
    })
    .sort((a, b) => a.ms - b.ms);
}

/**
 * @description Price consumption intervals with a compiled tariff: the rule engine of
 * docs/specs/energy-contracts.md (section 7). Pure: knows neither suppliers nor
 * integrations, reads calendars through the lookup it is given.
 * @param {object} compiled - Output of compileTariff.
 * @param {object} contract - The contract: `timezone`, `billing_period_start_day` (1 by default).
 * @param {Array<object>} intervals - The intervals: `starts_at`, `kwh`, optional `max_power_kw` and `duration_minutes`.
 * @param {object} [options] - Options: `calendars` (lookup), `cumulative_before` ({ day, month, billing_period }
 * kWh accumulated before the first interval), `closed_period` (boolean, include the demand charges),
 * `exclude_kinds` (component kinds left out of the costs: a tax only applies to what is priced).
 * @returns {object} The run result: costs (starts_at, cost, components, label per interval), warnings, cumulative.
 * @example
 * priceIntervals(compiled, { timezone: 'Europe/Paris' }, [{ starts_at: '2026-01-12T06:00:00Z', kwh: 1.2 }]);
 */
function priceIntervals(compiled, contract, intervals, options = {}) {
  const tz = contract.timezone;
  const billingPeriodStartDay = contract.billing_period_start_day || 1;
  const lookup = options.calendars || EMPTY_LOOKUP;
  const excludedKinds = new Set(options.exclude_kinds || []);
  const prepared = prepareIntervals(intervals, tz, billingPeriodStartDay);
  const warnings = [];
  const cumulative = { day: 0, month: 0, billing_period: 0, ...(options.cumulative_before || {}) };
  const currentPeriodIds = {};
  const demandByInterval =
    options.closed_period && !excludedKinds.has(TARIFF_COMPONENT_KINDS.DEMAND)
      ? computeDemandCharges(compiled, prepared)
      : null;

  const costs = prepared.map((interval, index) => {
    // Reset the accumulations whose period changed (the first interval keeps cumulative_before).
    SCOPES.forEach((scope) => {
      const id = interval.periodIds[scope];
      if (currentPeriodIds[scope] !== undefined && currentPeriodIds[scope] !== id) {
        cumulative[scope] = 0;
      }
      currentPeriodIds[scope] = id;
    });
    const context = {
      local: interval.local,
      getCalendarValue: (key) => lookup.get(key, interval.ms, interval.local, tz),
      maxPowerKw: interval.maxPowerKw,
    };
    const components = {};
    let label;
    compiled.components.forEach((component) => {
      if (excludedKinds.has(component.kind)) {
        return;
      }
      let amount = 0;
      if (component.kind === TARIFF_COMPONENT_KINDS.CONSUMPTION) {
        const result = evaluateConsumption(component, interval, context, cumulative, warnings);
        amount = result.amount;
        if (result.label !== undefined) {
          label = result.label;
        }
      } else if (component.kind === TARIFF_COMPONENT_KINDS.FIXED) {
        amount = evaluateFixed(component, interval, tz);
      } else if (component.kind === TARIFF_COMPONENT_KINDS.TAX) {
        // applies_to only references components declared before this one (validated);
        // an excluded component has no amount to tax
        const base = component.applies_to.reduce((sum, key) => sum + (components[key] || 0), 0);
        amount = (base * component.rate) / 100;
      } else if (demandByInterval !== null && demandByInterval[index][component.key] !== undefined) {
        amount = demandByInterval[index][component.key];
      }
      components[component.key] = roundCost(amount);
    });
    SCOPES.forEach((scope) => {
      cumulative[scope] += interval.kwh;
    });
    const cost = roundCost(Object.values(components).reduce((sum, amount) => sum + amount, 0));
    return { starts_at: interval.startsAt, cost, components, label };
  });

  return { costs, warnings, cumulative };
}

module.exports = {
  priceIntervals,
  prepareIntervals,
  evaluateConsumption,
  evaluateFixed,
  resolvePrice,
  roundCost,
};
