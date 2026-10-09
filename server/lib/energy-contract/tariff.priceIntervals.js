const {
  TARIFF_COMPONENT_KINDS,
  TARIFF_FIXED_PERIODS,
  TARIFF_CUMULATIVE_SCOPES,
  DEFAULT_INTERVAL_DURATION_MINUTES,
  COST_DECIMALS,
  CALENDAR_WARNING_REASONS,
} = require('./tariff.constants');
const { getLocalContext, getDayBounds, getMonthBounds, getPeriodIds, MS_PER_MINUTE } = require('./tariff.time');
const { matchesConditions } = require('./tariff.conditions');
const { computeDemandCharges } = require('./tariff.demand');
const { createCalendarLookup } = require('./calendar.lookup');
const { createAccumulation, readTierCumulative, getTierBounds } = require('./tariff.tier');

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
 * @param {object} context - The interval context: local, getCalendarValue, maxPowerKw, and
 * `tierBounds(tier)` (the kWh bounds of a tier for this interval).
 * @param {object} cumulative - The kWh accumulated before this interval, per scope and counter.
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
        const before = readTierCumulative(tier, cumulative);
        const bounds = context.tierBounds(tier);
        const rangeStart = before + offset;
        const rangeEnd = before + interval.kwh;
        const share = Math.min(rangeEnd, bounds.to) - Math.max(rangeStart, bounds.from);
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
        periodIds: getPeriodIds(local.date, billingPeriodStartDay, tz),
      };
    })
    .sort((a, b) => a.ms - b.ms);
}

/**
 * @description The length of the slots a tariff prices the energy on: 15 minutes when it reads
 * a 15-minute calendar (section 7.1), 30 minutes (the interval itself) otherwise.
 * @param {object} compiled - Compiled tariff.
 * @param {object} lookup - Calendar lookup.
 * @returns {number} The slot length in minutes.
 * @example
 * getEvaluationSlotMinutes(compiled, lookup); // 15 for a tariff reading a 15-minute spot calendar
 */
function getEvaluationSlotMinutes(compiled, lookup) {
  return compiled.calendars.reduce((minutes, key) => {
    const slotMinutes = lookup.slotMinutes(key);
    return slotMinutes !== undefined && slotMinutes < minutes ? slotMinutes : minutes;
  }, DEFAULT_INTERVAL_DURATION_MINUTES);
}

/**
 * @description The slots the energy of a prepared interval is priced on: the interval itself,
 * or, for a 30-minute interval of a tariff reading a 15-minute calendar, its two quarters with
 * half of its energy each (consumption assumed uniform within the half-hour, the best the meter
 * data allows), each with its own local context and periods. An interval without energy is
 * never split: nothing to price, and the empty interval closing a counter replay at an instant
 * must not step into the next day.
 * @param {object} interval - Prepared interval.
 * @param {number} slotMinutes - Evaluation slot length (getEvaluationSlotMinutes).
 * @param {string} tz - Contract timezone.
 * @param {number} billingPeriodStartDay - Billing period start day (1-31).
 * @returns {Array<object>} The slots, shaped like prepared intervals.
 * @example
 * splitInterval(interval, 15, 'Europe/Helsinki', 1);
 */
function splitInterval(interval, slotMinutes, tz, billingPeriodStartDay) {
  if (
    interval.durationMinutes !== DEFAULT_INTERVAL_DURATION_MINUTES ||
    slotMinutes >= interval.durationMinutes ||
    !(interval.kwh > 0)
  ) {
    return [interval];
  }
  const count = interval.durationMinutes / slotMinutes;
  const kwh = interval.kwh / count;
  const slots = [{ ...interval, kwh, durationMinutes: slotMinutes }];
  for (let index = 1; index < count; index += 1) {
    const ms = interval.ms + index * slotMinutes * MS_PER_MINUTE;
    const local = getLocalContext(ms, tz);
    slots.push({
      ms,
      startsAt: new Date(ms).toISOString(),
      kwh,
      durationMinutes: slotMinutes,
      // the peak of the interval is the only one known
      maxPowerKw: interval.maxPowerKw,
      local,
      periodIds: getPeriodIds(local.date, billingPeriodStartDay, tz),
    });
  }
  return slots;
}

/**
 * @description Price consumption intervals with a compiled tariff: the rule engine of
 * docs/specs/energy-contracts.md (section 7). Pure: knows neither suppliers nor
 * integrations, reads calendars through the lookup it is given.
 * @param {object} compiled - Output of compileTariff.
 * @param {object} contract - The contract: `timezone`, `billing_period_start_day` (1 by default).
 * @param {Array<object>} intervals - The intervals: `starts_at`, `kwh`, optional `max_power_kw` and `duration_minutes`.
 * @param {object} [options] - Options: `calendars` (lookup), `cumulative_before` ({ day, month, billing_period,
 * counters? } kWh accumulated before the first interval, as a previous run returned it), `closed_period`
 * (boolean, include the demand charges), `exclude_kinds` (component kinds left out of the costs: a tax only
 * applies to what is priced).
 * @returns {object} The run result: costs (starts_at, cost, components, label per interval: the label of the first
 * consumption component that has one), warnings,
 * cumulative ({ day, month, billing_period } plus the `counters` of the `counts_when` tiers, if any).
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
  const accumulation = createAccumulation(compiled, options.cumulative_before);
  const currentPeriodIds = {};
  // the kWh bounds of a per-day tier depend on the days of the interval's period: computed once per period
  const boundsCache = new Map();
  const tierBoundsAt = (tier, interval) => {
    const key = `${tier.counter}|${tier.from}|${tier.to}|${interval.periodIds[tier.cumulative]}`;
    if (!boundsCache.has(key)) {
      boundsCache.set(key, getTierBounds(tier, interval.local.date, contract));
    }
    return boundsCache.get(key);
  };
  const demandByInterval =
    options.closed_period && !excludedKinds.has(TARIFF_COMPONENT_KINDS.DEMAND)
      ? computeDemandCharges(compiled, prepared)
      : null;
  const slotMinutes = getEvaluationSlotMinutes(compiled, lookup);
  const pricesConsumption = !excludedKinds.has(TARIFF_COMPONENT_KINDS.CONSUMPTION);

  const costs = prepared.map((interval, index) => {
    // The energy is priced slot by slot (the quarters of the interval for a tariff reading a
    // 15-minute calendar): the tiers and the counters see the slots in order.
    const consumptionAmounts = {};
    let label;
    splitInterval(interval, slotMinutes, tz, billingPeriodStartDay).forEach((slot) => {
      // Reset the accumulations whose period changed (the first interval keeps cumulative_before).
      SCOPES.forEach((scope) => {
        const id = slot.periodIds[scope];
        if (currentPeriodIds[scope] !== undefined && currentPeriodIds[scope] !== id) {
          accumulation.reset(scope);
        }
        currentPeriodIds[scope] = id;
      });
      const context = {
        local: slot.local,
        getCalendarValue: (key) => lookup.get(key, slot.ms, slot.local, tz),
        maxPowerKw: slot.maxPowerKw,
        tierBounds: (tier) => tierBoundsAt(tier, slot),
      };
      // the label of the first consumption component that has one: the energy price, declared
      // first, is never hidden by a per-kWh levy declared after it
      let slotLabel;
      compiled.components.forEach((component) => {
        if (component.kind !== TARIFF_COMPONENT_KINDS.CONSUMPTION || !pricesConsumption) {
          return;
        }
        const result = evaluateConsumption(component, slot, context, accumulation.state, warnings);
        consumptionAmounts[component.key] = (consumptionAmounts[component.key] || 0) + result.amount;
        if (slotLabel === undefined) {
          slotLabel = result.label;
        }
      });
      if (slotLabel !== undefined) {
        label = slotLabel;
      }
      accumulation.add(slot, context);
    });
    const components = {};
    compiled.components.forEach((component) => {
      if (excludedKinds.has(component.kind)) {
        return;
      }
      let amount = 0;
      if (component.kind === TARIFF_COMPONENT_KINDS.CONSUMPTION) {
        amount = consumptionAmounts[component.key];
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
    const cost = roundCost(Object.values(components).reduce((sum, amount) => sum + amount, 0));
    return { starts_at: interval.startsAt, cost, components, label };
  });

  return { costs, warnings, cumulative: accumulation.snapshot() };
}

module.exports = {
  priceIntervals,
  prepareIntervals,
  getEvaluationSlotMinutes,
  splitInterval,
  evaluateConsumption,
  evaluateFixed,
  resolvePrice,
  roundCost,
};
