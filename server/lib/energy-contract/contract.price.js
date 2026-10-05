const { ENERGY_CONTRACT_PRICING_MODES } = require('../../utils/constants');
const { compileTariff } = require('./tariff.compile');
const { priceIntervals } = require('./tariff.priceIntervals');
const { getBillingPeriodBounds, getLocalContext } = require('./tariff.time');
const { MAX_ENERGY_INTERVALS_PER_REQUEST } = require('../external-integration/constants');

/**
 * @description Compile the tariff of a contract, cached per contract id and version: the
 * job compiles each contract once per run (section 7.5).
 * @param {object} contract - The contract.
 * @returns {object} The compiled tariff.
 * @example
 * const compiled = this.getCompiledTariff(contract);
 */
function getCompiledTariff(contract) {
  const cacheKey = `${contract.id}:${new Date(contract.updated_at || 0).getTime()}`;
  const cached = this.compiledTariffs.get(contract.id);
  if (cached && cached.key === cacheKey) {
    return cached.compiled;
  }
  const compiled = compileTariff(contract.tariff, contract.inputs || {});
  this.compiledTariffs.set(contract.id, { key: cacheKey, compiled });
  return compiled;
}

/**
 * @description Split intervals per billing period of the contract, in order (a delegated
 * request carries the intervals of one period, ≤ 31 days).
 * @param {object} contract - The contract.
 * @param {Array<object>} intervals - Sorted intervals.
 * @returns {Array<object>} [{ bounds, intervals }].
 * @example
 * splitByBillingPeriod(contract, intervals);
 */
function splitByBillingPeriod(contract, intervals) {
  const groups = [];
  intervals.forEach((interval) => {
    const ms = new Date(interval.starts_at).getTime();
    const { date } = getLocalContext(ms, contract.timezone);
    const bounds = getBillingPeriodBounds(date, contract.billing_period_start_day || 1, contract.timezone);
    const last = groups[groups.length - 1];
    if (last && last.bounds.id === bounds.id) {
      last.intervals.push(interval);
    } else {
      groups.push({ bounds, intervals: [interval] });
    }
  });
  return groups;
}

/**
 * @description Price the consumption intervals of a contract: with the core engine
 * (`rules`), or by the integration (`delegated`, the core still computes the fixed
 * components unless they are excluded). Loads the calendars of the run window once.
 * Returns the engine result; in delegated mode the intervals the integration did not
 * price are absent from `costs`.
 * @param {object} contract - The contract (plain object).
 * @param {Array<object>} intervals - [{ starts_at, kwh, max_power_kw?, duration_minutes? }].
 * @param {object} [options] - `cumulative_before`, `closed_period`, `calendars` (preloaded lookup)
 * and `exclude_kinds` (component kinds left out, see `priceIntervals`).
 * @returns {Promise<object>} { costs, warnings, cumulative, unpriced }.
 * @example
 * await priceContractIntervals(contract, [{ starts_at: '2026-01-12T06:00:00Z', kwh: 1.2 }]);
 */
async function priceContractIntervals(contract, intervals, options = {}) {
  if (intervals.length === 0) {
    return { costs: [], warnings: [], cumulative: { ...(options.cumulative_before || {}) }, unpriced: [] };
  }
  const sorted = [...intervals].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const compiled = this.getCompiledTariff(contract);
  const fromMs = new Date(sorted[0].starts_at).getTime();
  const toMs = new Date(sorted[sorted.length - 1].starts_at).getTime();
  const calendars =
    options.calendars || (await this.loadCalendarLookup(compiled.calendars, fromMs, toMs, contract.timezone));
  const engineResult = priceIntervals(compiled, contract, sorted, {
    calendars,
    cumulative_before: options.cumulative_before,
    closed_period: options.closed_period,
    exclude_kinds: options.exclude_kinds,
  });
  if (contract.pricing_mode !== ENERGY_CONTRACT_PRICING_MODES.DELEGATED) {
    return { ...engineResult, unpriced: [] };
  }
  // Delegated: the integration prices the energy per billing period, the core adds the
  // fixed components it computed above when they are not excluded (a delegated tariff
  // only carries fixed components).
  const fixedByStart = new Map(engineResult.costs.map((c) => [c.starts_at, c]));
  const costs = [];
  const unpriced = [];
  const groups = splitByBillingPeriod(contract, sorted);
  const cumulative = { day: 0, month: 0, billing_period: 0, ...(options.cumulative_before || {}) };
  const localDate = (interval) => getLocalContext(new Date(interval.starts_at).getTime(), contract.timezone).date;
  // the local date of the last interval handed to the integration
  let currentDate = null;
  // eslint-disable-next-line no-restricted-syntax
  for (const group of groups) {
    // a billing period starts at local midnight: the day and period accumulations restart,
    // the month one carries on only inside the same local month
    if (currentDate !== null) {
      cumulative.day = 0;
      cumulative.billing_period = 0;
      if (currentDate.slice(0, 7) !== localDate(group.intervals[0]).slice(0, 7)) {
        cumulative.month = 0;
      }
    }
    // a period longer than one request (a 31-day period with the autumn DST change has 1,490
    // intervals) is sent in several requests, each with the accumulations before its first interval
    for (let offset = 0; offset < group.intervals.length; offset += MAX_ENERGY_INTERVALS_PER_REQUEST) {
      const chunk = group.intervals.slice(offset, offset + MAX_ENERGY_INTERVALS_PER_REQUEST);
      let delegated;
      try {
        // eslint-disable-next-line no-await-in-loop
        delegated = await this.externalIntegration.priceEnergyContract(contract, {
          billing_period: {
            starts_at: new Date(group.bounds.startMs).toISOString(),
            ends_at: new Date(group.bounds.endMs).toISOString(),
          },
          cumulative_before: {
            day: cumulative.day,
            month: cumulative.month,
            billing_period: cumulative.billing_period,
          },
          intervals: chunk.map((i) => {
            const prepared = fixedByStart.get(new Date(i.starts_at).toISOString());
            return {
              starts_at: prepared.starts_at,
              kwh: Number(i.kwh) || 0,
              max_power_kw:
                i.max_power_kw === undefined || i.max_power_kw === null
                  ? ((Number(i.kwh) || 0) * 60) / (i.duration_minutes || 30)
                  : Number(i.max_power_kw),
            };
          }),
        });
      } catch (e) {
        engineResult.warnings.push({
          reason: 'delegated_failed',
          message: e.message,
          from: chunk[0].starts_at,
        });
        chunk.forEach((i) => unpriced.push(new Date(i.starts_at).toISOString()));
        delegated = new Map();
      }
      chunk.forEach((i) => {
        const startsAt = new Date(i.starts_at).toISOString();
        const fixed = fixedByStart.get(startsAt);
        const energy = delegated.get(startsAt);
        if (energy === undefined) {
          if (delegated.size > 0) {
            unpriced.push(startsAt);
          }
          return;
        }
        const components = { ...fixed.components, ...energy.components };
        const cost = Math.round((fixed.cost + energy.cost) * 1e6) / 1e6;
        costs.push({ starts_at: startsAt, cost, components, label: energy.label });
      });
      // what this request consumed feeds the accumulations of the next one
      // eslint-disable-next-line no-restricted-syntax
      for (const i of chunk) {
        const date = localDate(i);
        if (currentDate !== null && date !== currentDate) {
          cumulative.day = 0;
          if (date.slice(0, 7) !== currentDate.slice(0, 7)) {
            cumulative.month = 0;
          }
        }
        currentDate = date;
        const kwh = Number(i.kwh) || 0;
        cumulative.day += kwh;
        cumulative.month += kwh;
        cumulative.billing_period += kwh;
      }
    }
  }
  return { costs, warnings: engineResult.warnings, cumulative: engineResult.cumulative, unpriced };
}

module.exports = { priceContractIntervals, getCompiledTariff, splitByBillingPeriod };
