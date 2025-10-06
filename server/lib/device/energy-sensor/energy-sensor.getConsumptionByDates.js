const Promise = require('bluebird');
const db = require('../../../models');

const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');

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
    AND created_at <= ?
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
 * @returns {Promise<array>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-device', {
 *   from: new Date('2023-01-01'),
 *   to: new Date('2023-01-31'),
 *   group_by: 'day'
 * });
 */
async function getConsumptionByDates(selectors, options = {}) {
  return Promise.map(
    selectors,
    async (selector) => {
      const deviceFeature = this.stateManager.get('deviceFeature', selector);
      if (deviceFeature === null) {
        throw new NotFoundError('DeviceFeature not found');
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

      // Rename grouped_date to created_at for consistency with the existing API
      values = values.map((value) => ({
        ...value,
        created_at: value.grouped_date,
        count_value: Number(value.count_value),
      }));

      return {
        device: {
          name: device.name,
        },
        deviceFeature: {
          name: deviceFeature.name,
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
