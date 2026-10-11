const { TARIFF_CUMULATIVE_SCOPES } = require('./tariff.constants');
const { getMonthBounds, getBillingPeriodBounds, getLocalContext, addDays, daysBetween } = require('./tariff.time');
const { matchesConditions } = require('./tariff.conditions');

const SCOPES = Object.values(TARIFF_CUMULATIVE_SCOPES);

/**
 * @description Serialize a JSON value with its object keys sorted, so that two equal
 * conditions written in a different key order share the same counter.
 * @param {*} value - Any JSON value.
 * @returns {string} The canonical JSON text.
 * @example
 * canonicalJson({ b: 1, a: [2] }); // '{"a":[2],"b":1}'
 */
function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * @description The normal form of `counts_when` conditions: a calendar value and the list
 * holding it alone are the same condition, and so are two lists of the same values.
 * @param {object} countsWhen - The rule's `counts_when` conditions (validated JSON).
 * @returns {object} The conditions with every calendar value list sorted and deduplicated.
 * @example
 * normalizeCountsWhen({ calendar: { tempo: 'red' } }); // { calendar: { tempo: ['red'] } }
 */
function normalizeCountsWhen(countsWhen) {
  const normalized = { ...countsWhen };
  ['calendar', 'not_calendar'].forEach((conditionKey) => {
    const condition = countsWhen[conditionKey];
    if (condition === undefined) {
      return;
    }
    normalized[conditionKey] = {};
    Object.keys(condition).forEach((key) => {
      const values = Array.isArray(condition[key]) ? condition[key] : [condition[key]];
      normalized[conditionKey][key] = Array.from(new Set(values.map((value) => String(value)))).sort();
    });
  });
  ['weekdays', 'months'].forEach((listKey) => {
    if (countsWhen[listKey] !== undefined) {
      normalized[listKey] = [...countsWhen[listKey]].sort();
    }
  });
  return normalized;
}

/**
 * @description The id of the accumulation counter a tier rule reads (section 7.1): the
 * scope alone for a plain tier, the scope and the canonical `counts_when` conditions for
 * a filtered one, so that every rule with the same scope and conditions shares a counter.
 * @param {string} scope - Accumulation scope (day, month, billing_period).
 * @param {object} [countsWhen] - The rule's `counts_when` conditions (validated JSON).
 * @returns {string} The counter id.
 * @example
 * getTierCounterId('month', { not_calendar: { 'hq-critical-peaks': 'critical-peak' } });
 */
function getTierCounterId(scope, countsWhen) {
  return countsWhen === undefined ? scope : `${scope}:${canonicalJson(normalizeCountsWhen(countsWhen))}`;
}

/**
 * @description A contract validity bound as a local "YYYY-MM-DD" date.
 * @param {Date|string|null|undefined} value - `valid_from` / `valid_to` of the contract.
 * @param {string} tz - Contract timezone.
 * @returns {string|undefined} The local date, undefined when the bound is open.
 * @example
 * toLocalDate('2026-01-15', 'America/Toronto'); // '2026-01-15'
 */
function toLocalDate(value, tz) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value instanceof Date) {
    return getLocalContext(value.getTime(), tz).date;
  }
  return String(value).slice(0, 10);
}

/**
 * @description Number of local days of the accumulation period a date belongs to,
 * intersected with the contract validity (`valid_from` / `valid_to`, inclusive local
 * dates): what a `*_kwh_per_day` bound is multiplied by. A supplier counts the days of
 * the consumption period it bills, so a contract starting or ending mid-period only
 * counts its own days. Always at least 1: the contract covers the day it prices.
 * @param {string} scope - Accumulation scope (day, month, billing_period).
 * @param {string} dateString - Local date of the interval.
 * @param {object} contract - `timezone`, `billing_period_start_day`, optional `valid_from` / `valid_to`.
 * @returns {number} The number of days.
 * @example
 * getAccumulationPeriodDays('month', '2026-02-10', { timezone: 'America/Toronto' }); // 28
 */
function getAccumulationPeriodDays(scope, dateString, contract) {
  if (scope === TARIFF_CUMULATIVE_SCOPES.DAY) {
    return 1;
  }
  const tz = contract.timezone;
  const bounds =
    scope === TARIFF_CUMULATIVE_SCOPES.MONTH
      ? getMonthBounds(dateString, tz)
      : getBillingPeriodBounds(dateString, contract.billing_period_start_day || 1, tz);
  let start = bounds.startDate;
  let end = bounds.endDate;
  const validFrom = toLocalDate(contract.valid_from, tz);
  const validTo = toLocalDate(contract.valid_to, tz);
  if (validFrom !== undefined && validFrom > start) {
    start = validFrom;
  }
  if (validTo !== undefined && addDays(validTo, 1) < end) {
    end = addDays(validTo, 1);
  }
  return Math.max(daysBetween(start, end), 1);
}

/**
 * @description The kWh bounds of a compiled tier for an interval: the fixed bounds of a
 * plain tier, or the per-day bounds multiplied by the days of the interval's accumulation
 * period (section 7.2).
 * @param {object} tier - Compiled tier.
 * @param {string} dateString - Local date of the interval.
 * @param {object} contract - The contract (timezone, billing period start day, validity).
 * @returns {object} { from, to } in kWh (`to` may be Infinity).
 * @example
 * getTierBounds(tier, '2026-01-12', contract); // { from: 0, to: 1240 }
 */
function getTierBounds(tier, dateString, contract) {
  if (!tier.per_day) {
    return { from: tier.from, to: tier.to };
  }
  const days = getAccumulationPeriodDays(tier.cumulative, dateString, contract);
  return { from: tier.from * days, to: tier.to * days };
}

/**
 * @description The kWh a tier rule has accumulated before an interval: its scope's plain
 * accumulation, or its filtered counter when the rule has `counts_when`.
 * @param {object} tier - Compiled tier.
 * @param {object} cumulative - { day, month, billing_period, counters? }.
 * @returns {number} The kWh accumulated so far (0 when unknown).
 * @example
 * readTierCumulative(tier, { day: 3, month: 40, billing_period: 40 });
 */
function readTierCumulative(tier, cumulative) {
  if (tier.counts_when === undefined) {
    return cumulative[tier.cumulative] || 0;
  }
  const counter = cumulative.counters === undefined ? undefined : cumulative.counters[tier.counter];
  return counter === undefined ? 0 : counter.kwh;
}

/**
 * @description The accumulations of an engine run: the plain kWh per scope and, for the
 * tier rules with `counts_when`, one counter per (scope, conditions) fed only by the
 * intervals matching those conditions (section 7.1). `state` has the shape of the
 * `cumulative` the engine returns and accepts back as `cumulative_before`.
 * @param {object} compiled - Compiled tariff (its `counters` list the filtered counters).
 * @param {object} [cumulativeBefore] - The accumulations before the first interval.
 * @returns {object} { state, reset(scope), add(interval, context), snapshot() }.
 * @example
 * const accumulation = createAccumulation(compiled, { day: 39 });
 */
function createAccumulation(compiled, cumulativeBefore = {}) {
  const state = { day: 0, month: 0, billing_period: 0 };
  SCOPES.forEach((scope) => {
    if (cumulativeBefore[scope] !== undefined) {
      state[scope] = cumulativeBefore[scope];
    }
  });
  const counters = compiled.counters || [];
  if (counters.length > 0) {
    state.counters = {};
    counters.forEach((counter) => {
      const before = cumulativeBefore.counters === undefined ? undefined : cumulativeBefore.counters[counter.id];
      state.counters[counter.id] = { scope: counter.scope, kwh: before === undefined ? 0 : before.kwh };
    });
  }
  return {
    state,
    reset(scope) {
      state[scope] = 0;
      counters.forEach((counter) => {
        if (counter.scope === scope) {
          state.counters[counter.id].kwh = 0;
        }
      });
    },
    add(interval, context) {
      SCOPES.forEach((scope) => {
        state[scope] += interval.kwh;
      });
      counters.forEach((counter) => {
        if (matchesConditions(counter.when, context)) {
          state.counters[counter.id].kwh += interval.kwh;
        }
      });
    },
    snapshot() {
      const copy = { day: state.day, month: state.month, billing_period: state.billing_period };
      if (state.counters !== undefined) {
        copy.counters = {};
        Object.keys(state.counters).forEach((id) => {
          copy.counters[id] = { ...state.counters[id] };
        });
      }
      return copy;
    },
  };
}

/**
 * @description The accumulations as they stand once the engine has crossed from one instant's
 * periods to another's: the scopes whose period id changed restart at zero, their counters
 * included, the others carry on (what `priceIntervals` does between two intervals; the current
 * price scan needs the same reset when it crosses a day, month or billing period boundary).
 * @param {object} cumulative - { day, month, billing_period, counters? }.
 * @param {object} fromIds - Period ids of the instant the accumulations belong to (getPeriodIds).
 * @param {object} toIds - Period ids of the evaluated instant.
 * @returns {object} A copy of the accumulations with the changed periods reset.
 * @example
 * resetChangedPeriods(cumulative, getPeriodIds('2026-01-31', 1, 'UTC'), getPeriodIds('2026-02-01', 1, 'UTC'));
 */
function resetChangedPeriods(cumulative, fromIds, toIds) {
  const changed = SCOPES.filter((scope) => fromIds[scope] !== toIds[scope]);
  if (changed.length === 0) {
    return cumulative;
  }
  const reset = { ...cumulative };
  changed.forEach((scope) => {
    reset[scope] = 0;
  });
  if (cumulative.counters !== undefined) {
    reset.counters = {};
    Object.keys(cumulative.counters).forEach((id) => {
      const counter = cumulative.counters[id];
      reset.counters[id] = { scope: counter.scope, kwh: changed.includes(counter.scope) ? 0 : counter.kwh };
    });
  }
  return reset;
}

/**
 * @description The accumulations a billing period hands to the next one inside the same
 * local month (section 7.4): the month accumulation and the month counters carry on, the
 * day and billing period ones restart at the boundary.
 * @param {object} cumulative - The `cumulative` returned by the engine for the elapsed period.
 * @returns {object} The `cumulative_before` of the next period.
 * @example
 * carryMonthAccumulation({ day: 3, month: 40, billing_period: 40 }); // { day: 0, month: 40, billing_period: 0 }
 */
function carryMonthAccumulation(cumulative) {
  const carried = { day: 0, month: cumulative.month, billing_period: 0 };
  if (cumulative.counters !== undefined) {
    carried.counters = {};
    Object.keys(cumulative.counters).forEach((id) => {
      const counter = cumulative.counters[id];
      carried.counters[id] = {
        scope: counter.scope,
        kwh: counter.scope === TARIFF_CUMULATIVE_SCOPES.MONTH ? counter.kwh : 0,
      };
    });
  }
  return carried;
}

module.exports = {
  canonicalJson,
  normalizeCountsWhen,
  getTierCounterId,
  toLocalDate,
  resetChangedPeriods,
  getAccumulationPeriodDays,
  getTierBounds,
  readTierCumulative,
  createAccumulation,
  carryMonthAccumulation,
};
