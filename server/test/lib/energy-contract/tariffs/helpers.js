const { compileTariff, priceIntervals, createCalendarLookup } = require('../../../../lib/energy-contract/engine');

/**
 * @description Compile a tariff with its inputs and price intervals with it.
 * @param {object} tariff - Tariff definition.
 * @param {object} contract - Contract ({ timezone, billing_period_start_day }).
 * @param {Array<object>} intervals - Intervals to price.
 * @param {object} [options] - The priceIntervals options plus `inputs`.
 * @returns {object} The priceIntervals result.
 * @example
 * price(tariff, { timezone: 'Europe/Paris' }, [{ starts_at: '2026-01-12T11:00:00Z', kwh: 1 }]);
 */
function price(tariff, contract, intervals, options = {}) {
  const { inputs, ...rest } = options;
  return priceIntervals(compileTariff(tariff, inputs), contract, intervals, rest);
}

/**
 * @description Build a 30-minute interval.
 * @param {string} startsAt - ISO start.
 * @param {number} kwh - Energy.
 * @param {object} [extra] - Extra fields (max_power_kw, duration_minutes).
 * @returns {object} The interval.
 * @example
 * interval('2026-01-12T11:00:00Z', 1);
 */
function interval(startsAt, kwh, extra = {}) {
  return { starts_at: startsAt, kwh, ...extra };
}

module.exports = { price, interval, createCalendarLookup };
