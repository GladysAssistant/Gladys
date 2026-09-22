const Promise = require('bluebird');
const db = require('../../../models');

const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { DEFAULT_ENERGY_PERIOD_START_DAY, parseEnergyPeriodStartDay } = require('../../../utils/energyPeriod');

/**
 * @description Build the query grouping device feature states by a date expression.
 * @param {string} dateExpression - SQL expression returning the start of the period a state belongs to.
 * @returns {string} The SQL query.
 * @example
 * buildGroupedQuery('DATE_TRUNC(?, created_at)');
 */
const buildGroupedQuery = (dateExpression) => `
  SELECT
    ${dateExpression} AS grouped_date,
    AVG(value) AS value,
    MAX(value) AS max_value,
    MIN(value) AS min_value,
    SUM(value) AS sum_value,
    COUNT(value) AS count_value
  FROM
    t_device_feature_state
  WHERE
    device_feature_id = ?
    AND created_at >= ?
    AND created_at < ?
  GROUP BY
    grouped_date
  ORDER BY
    grouped_date;
`;

const GROUPED_QUERY_DATE_RANGE = buildGroupedQuery('DATE_TRUNC(?, created_at)');

/**
 * @description Build the SQL expression returning the start of the billing period a state belongs to.
 * Periods start on `periodStartDay` at local midnight (the DuckDB session timezone is set to the
 * Gladys system timezone). When a month is shorter than the configured start day (ex: the 31st in
 * February), the period starts on the last day of that month.
 * @param {string} groupBy - Grouping period: 'month' or 'year'.
 * @param {number} periodStartDay - Day of the month the billing period starts on (2-31).
 * @returns {string} The SQL expression.
 * @example
 * buildOffsetDateExpression('month', 5);
 */
const buildOffsetDateExpression = (groupBy, periodStartDay) => {
  // Number of days between the first day of the month/year and the start of the period.
  const offsetInDays = periodStartDay - 1;
  if (groupBy === 'year') {
    // January always has 31 days, so the start day never needs to be clamped here.
    return `
    CASE
      WHEN created_at >= DATE_TRUNC('year', created_at) + TO_DAYS(${offsetInDays})
        THEN DATE_TRUNC('year', created_at) + TO_DAYS(${offsetInDays})
      ELSE DATE_TRUNC('year', created_at - INTERVAL 1 YEAR) + TO_DAYS(${offsetInDays})
    END`;
  }
  return `
    CASE
      WHEN EXTRACT('day' FROM created_at) >= LEAST(${periodStartDay}, EXTRACT('day' FROM LAST_DAY(created_at)))
        THEN DATE_TRUNC('month', created_at)
          + TO_DAYS(CAST(LEAST(${periodStartDay}, EXTRACT('day' FROM LAST_DAY(created_at))) - 1 AS INTEGER))
      ELSE DATE_TRUNC('month', created_at - INTERVAL 1 MONTH)
        + TO_DAYS(
          CAST(LEAST(${periodStartDay}, EXTRACT('day' FROM LAST_DAY(created_at - INTERVAL 1 MONTH))) - 1 AS INTEGER)
        )
    END`;
};

/**
 * @description Tell if the monthly/yearly buckets must be offset to match the billing period.
 * Hourly, daily and weekly buckets are never affected by the start day of the billing period.
 * @param {string} groupBy - Grouping period ('hour', 'day', 'week', 'month', 'year').
 * @param {number} periodStartDay - Day of the month the billing period starts on (1-31).
 * @returns {boolean} True if the buckets must be offset.
 * @example
 * shouldOffsetPeriods('month', 5);
 */
const shouldOffsetPeriods = (groupBy, periodStartDay) =>
  periodStartDay !== DEFAULT_ENERGY_PERIOD_START_DAY && (groupBy === 'month' || groupBy === 'year');

/**
 * @description Get electricity consumption by date.
 * @param {Array<string>} selectors - Device selector.
 * @param {object} options - Options object.
 * @param {Date} [options.from] - Start date for date range approach.
 * @param {Date} [options.to] - End date for date range approach.
 * @param {string} [options.group_by] - Group results by time period ('hour', 'day', 'week', 'month', 'year').
 * @param {string} [options.display_mode] - Display mode: 'currency' (default) or 'kwh'.
 * @param {number} [options.period_start_day] - Day of the month monthly/yearly periods start on (1-31).
 * @returns {Promise<object>} - Resolve with an object containing consumption and subscription data.
 * @example
 * device.getConsumptionByDates(['test-device'], {
 *   from: new Date('2023-01-01'),
 *   to: new Date('2023-01-31'),
 *   group_by: 'day'
 * });
 */
async function getConsumptionByDates(selectors, options = {}) {
  const { display_mode: displayMode = 'currency' } = options;

  const periodStartDay = parseEnergyPeriodStartDay(options.period_start_day);
  if (periodStartDay === null) {
    throw new BadParameters('"period_start_day" must be an integer between 1 and 31');
  }

  const consumptionResults = await Promise.map(
    selectors,
    async (selector) => {
      let deviceFeature = this.stateManager.get('deviceFeature', selector);
      if (deviceFeature === null) {
        throw new NotFoundError('DeviceFeature not found');
      }

      // Store the original cost feature's currency unit before potentially swapping
      const originalCostFeature = deviceFeature;
      const currencyUnit =
        originalCostFeature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        originalCostFeature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST
          ? originalCostFeature.unit
          : null;

      // If display_mode is 'kwh' and this is a cost feature, hot-replace with the consumption feature
      // The cost feature has energy_parent_id pointing to the consumption feature
      if (
        displayMode === 'kwh' &&
        deviceFeature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        deviceFeature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST &&
        deviceFeature.energy_parent_id
      ) {
        const consumptionFeature = this.stateManager.get('deviceFeatureById', deviceFeature.energy_parent_id);
        if (consumptionFeature) {
          deviceFeature = consumptionFeature;
        }
      }

      const device = this.stateManager.get('deviceById', deviceFeature.device_id);

      // Extract options with defaults
      const { from, to, group_by: groupBy = null } = options;

      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (fromDate >= toDate) {
        throw new BadParameters('"from" date must be before "to" date');
      }

      // Offset in UTC
      fromDate.setMinutes(fromDate.getMinutes() - fromDate.getTimezoneOffset());
      toDate.setMinutes(toDate.getMinutes() - toDate.getTimezoneOffset());

      let values;

      // Validate groupBy parameter if provided
      const validGroupByOptions = ['hour', 'day', 'week', 'month', 'year'];

      if (groupBy !== null && !validGroupByOptions.includes(groupBy)) {
        throw new BadParameters(`Invalid groupBy parameter. Must be one of: ${validGroupByOptions.join(', ')}`);
      }

      if (shouldOffsetPeriods(groupBy, periodStartDay)) {
        // The billing period does not start on the 1st: group on offset month/year boundaries.
        values = await db.duckDbReadConnectionAllAsync(
          buildGroupedQuery(buildOffsetDateExpression(groupBy, periodStartDay)),
          deviceFeature.id,
          fromDate,
          toDate,
        );
      } else {
        values = await db.duckDbReadConnectionAllAsync(
          GROUPED_QUERY_DATE_RANGE,
          groupBy,
          deviceFeature.id,
          fromDate,
          toDate,
        );
      }

      // Check if we need to convert from Wh to kWh (when display_mode is 'kwh' and unit is WATT_HOUR)
      const needsWhToKwhConversion = displayMode === 'kwh' && deviceFeature.unit === DEVICE_FEATURE_UNITS.WATT_HOUR;

      // Rename grouped_date to created_at for consistency with the existing API
      // and convert Wh to kWh if needed
      values = values.map((value) => {
        const conversionFactor = needsWhToKwhConversion ? 1 / 1000 : 1;
        const newValue = {
          ...value,
          created_at: value.grouped_date,
          count_value: Number(value.count_value),
          value: value.value * conversionFactor,
          max_value: value.max_value * conversionFactor,
          min_value: value.min_value * conversionFactor,
          sum_value: value.sum_value * conversionFactor,
        };
        delete newValue.grouped_date;
        return newValue;
      });

      return {
        device: {
          name: device.name,
        },
        deviceFeature: {
          name: deviceFeature.name,
          selector,
          currency_unit: currencyUnit,
          // the subscription of the contract is part of the stored costs
          // (docs/specs/energy-contracts.md 7.2): nothing is added at display time
          subscription_included: currencyUnit !== null,
        },
        values,
      };
    },
    { concurrency: 4 },
  );

  return consumptionResults;
}

module.exports = {
  getConsumptionByDates,
  buildOffsetDateExpression,
  shouldOffsetPeriods,
};
