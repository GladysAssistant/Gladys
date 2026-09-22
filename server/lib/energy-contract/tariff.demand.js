const { TARIFF_DEMAND_AGGREGATIONS, TARIFF_DEMAND_PERIODS } = require('./tariff.constants');
const { matchesConditions } = require('./tariff.conditions');

/**
 * @description Aggregate the peak power of a period's intervals.
 * @param {string} aggregation - `max` or `top3_average`.
 * @param {Array<object>} periodIntervals - Prepared intervals of the period ({ maxPowerKw, local }).
 * @returns {number} The aggregated peak, in kW.
 * @example
 * aggregatePeakPower('max', intervals);
 */
function aggregatePeakPower(aggregation, periodIntervals) {
  if (aggregation === TARIFF_DEMAND_AGGREGATIONS.TOP3_AVERAGE) {
    // Highest peak of each local day, then the mean of the three highest days
    // (the Norwegian "nettleie" rule: three distinct days).
    const peakByDay = new Map();
    periodIntervals.forEach((interval) => {
      const current = peakByDay.get(interval.local.date);
      if (current === undefined || interval.maxPowerKw > current) {
        peakByDay.set(interval.local.date, interval.maxPowerKw);
      }
    });
    const topDays = Array.from(peakByDay.values())
      .sort((a, b) => b - a)
      .slice(0, 3);
    return topDays.reduce((sum, peak) => sum + peak, 0) / topDays.length;
  }
  return periodIntervals.reduce((max, interval) => Math.max(max, interval.maxPowerKw), 0);
}

/**
 * @description Compute the demand charges of closed periods and spread them over the
 * intervals pro rata of their duration. Intervals are grouped by the component's
 * period (calendar month or billing period) so a run spanning several periods prices
 * each one on its own peak. Only called for closed periods (docs/specs/energy-contracts.md, 7.2).
 * @param {object} compiled - Compiled tariff.
 * @param {Array<object>} prepared - Prepared intervals ({ ms, durationMinutes, maxPowerKw, local, periodIds }).
 * @returns {Array<object>} One { [componentKey]: amount } per prepared interval (same order).
 * @example
 * const demandByInterval = computeDemandCharges(compiled, prepared);
 */
function computeDemandCharges(compiled, prepared) {
  const result = prepared.map(() => ({}));
  compiled.components
    .filter((component) => component.kind === 'demand')
    .forEach((component) => {
      const periodKey = component.per === TARIFF_DEMAND_PERIODS.MONTH ? 'month' : 'billing_period';
      const groups = new Map();
      prepared.forEach((interval, index) => {
        const id = interval.periodIds[periodKey];
        if (!groups.has(id)) {
          groups.set(id, []);
        }
        groups.get(id).push(index);
      });
      groups.forEach((indexes) => {
        // The component applies to the intervals of the period that satisfy its
        // conditions: a billing period straddling the season boundary is charged on
        // the peak of its in-season intervals only, spread over those intervals.
        // Period conditions (months, season, dates, weekdays) never read calendars nor power.
        const matching = indexes.filter((index) =>
          matchesConditions(component.when, { local: prepared[index].local, maxPowerKw: 0 }),
        );
        if (matching.length === 0) {
          return;
        }
        const periodIntervals = matching.map((index) => prepared[index]);
        const total = component.price * aggregatePeakPower(component.aggregation, periodIntervals);
        const totalMinutes = periodIntervals.reduce((sum, interval) => sum + interval.durationMinutes, 0);
        matching.forEach((index) => {
          result[index][component.key] = (total * prepared[index].durationMinutes) / totalMinutes;
        });
      });
    });
  return result;
}

module.exports = {
  aggregatePeakPower,
  computeDemandCharges,
};
