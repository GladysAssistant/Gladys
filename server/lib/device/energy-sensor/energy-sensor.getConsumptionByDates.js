const Promise = require('bluebird');
const db = require('../../../models');

const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');

const GROUPED_QUERY_DATE_RANGE = `
  SELECT
    DATE_TRUNC(?, created_at) AS grouped_date,
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

/**
 * @description Get electricity consumption by date.
 * @param {Array<string>} selectors - Device selector.
 * @param {object} options - Options object.
 * @param {Date} [options.from] - Start date for date range approach.
 * @param {Date} [options.to] - End date for date range approach.
 * @param {string} [options.group_by] - Group results by time period ('hour', 'day', 'week', 'month', 'year').
 * @param {string} [options.display_mode] - Display mode: 'currency' (default) or 'kwh'.
 * @returns {Promise<Array>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-device', {
 *   from: new Date('2023-01-01'),
 *   to: new Date('2023-01-31'),
 *   group_by: 'day'
 * });
 */
async function getConsumptionByDates(selectors, options = {}) {
  const { display_mode: displayMode = 'currency' } = options;

  return Promise.map(
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

      values = await db.duckDbReadConnectionAllAsync(
        GROUPED_QUERY_DATE_RANGE,
        groupBy,
        deviceFeature.id,
        fromDate,
        toDate,
      );

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
          currency_unit: currencyUnit,
        },
        values,
      };
    },
    { concurrency: 4 },
  );
}

module.exports = {
  getConsumptionByDates,
};
