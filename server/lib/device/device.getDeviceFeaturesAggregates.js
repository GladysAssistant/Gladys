const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const NON_BINARY_QUERY = `
  WITH intervals AS (
        SELECT
            created_at,
            value,
            NTILE(?) OVER (ORDER BY created_at) AS interval
        FROM
            t_device_feature_state
        WHERE device_feature_id = ?
        AND created_at > ?
    )
    SELECT
        MIN(created_at) AS created_at,
        AVG(value) AS value,
        MAX(value) AS max_value,
        MIN(value) AS min_value,
        SUM(value) AS sum_value,
        COUNT(value) AS count_value
    FROM
        intervals
    GROUP BY
        interval
    ORDER BY
        created_at;
`;

const NON_BINARY_QUERY_DATE_RANGE = `
  WITH intervals AS (
        SELECT
            created_at,
            value,
            NTILE(?) OVER (ORDER BY created_at) AS interval
        FROM
            t_device_feature_state
        WHERE device_feature_id = ?
        AND created_at >= ?
        AND created_at <= ?
    )
    SELECT
        MIN(created_at) AS created_at,
        AVG(value) AS value,
        MAX(value) AS max_value,
        MIN(value) AS min_value,
        SUM(value) AS sum_value,
        COUNT(value) AS count_value
    FROM
        intervals
    GROUP BY
        interval
    ORDER BY
        created_at;
`;

const GROUPED_QUERY = `
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
    AND created_at > ?
  GROUP BY
    grouped_date
  ORDER BY
    grouped_date;
`;

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

const BINARY_QUERY = `
WITH value_changes AS (
    SELECT
        created_at,
        value,
        LAG(value) OVER (ORDER BY created_at) AS prev_value
    FROM
        t_device_feature_state
    WHERE
        device_feature_id = ?
        AND created_at > ?
),
state_transitions AS (
    SELECT
        created_at,
        value,
        LEAD(created_at) OVER (ORDER BY created_at) AS end_time
    FROM
        value_changes
    WHERE
        prev_value IS NULL OR value != prev_value
)
SELECT
    value,
    created_at,
    end_time
FROM
    state_transitions
ORDER BY
    created_at ASC
LIMIT ?
`;

const BINARY_QUERY_DATE_RANGE = `
WITH value_changes AS (
    SELECT
        created_at,
        value,
        LAG(value) OVER (ORDER BY created_at) AS prev_value
    FROM
        t_device_feature_state
    WHERE
        device_feature_id = ?
        AND created_at >= ?
        AND created_at <= ?
),
state_transitions AS (
    SELECT
        created_at,
        value,
        LEAD(created_at) OVER (ORDER BY created_at) AS end_time
    FROM
        value_changes
    WHERE
        prev_value IS NULL OR value != prev_value
)
SELECT
    value,
    created_at,
    end_time
FROM
    state_transitions
ORDER BY
    created_at ASC
LIMIT ?
`;

/**
 * @description Get all features states aggregates.
 * @param {string} selector - Device selector.
 * @param {object} options - Options object.
 * @param {number} [options.interval_in_minutes] - Interval in minutes (legacy approach).
 * @param {Date} [options.from] - Start date for date range approach.
 * @param {Date} [options.to] - End date for date range approach.
 * @param {number} [options.max_states=100] - Number of elements to return max.
 * @param {string} [options.group_by] - Group results by time period ('hour', 'day', 'week', 'month', 'year').
 * @returns {Promise<object>} - Resolve with an array of data.
 * @example
 * // Legacy approach with interval
 * device.getDeviceFeaturesAggregates('test-device', { intervalInMinutes: 60, maxStates: 100, groupBy: 'hour' });
 *
 * // New approach with date range
 * device.getDeviceFeaturesAggregates('test-device', {
 *   from: new Date('2023-01-01'),
 *   to: new Date('2023-01-31'),
 *   maxStates: 100,
 *   group_by: 'day'
 * });
 */
async function getDeviceFeaturesAggregates(selector, options = {}) {
  const deviceFeature = this.stateManager.get('deviceFeature', selector);
  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const device = this.stateManager.get('deviceById', deviceFeature.device_id);

  const isBinary = ['binary', 'push'].includes(deviceFeature.type);

  // Extract options with defaults
  const {
    interval_in_minutes: intervalInMinutes,
    from,
    to,
    max_states: maxStates = 100,
    group_by: groupBy = null,
  } = options;

  // Determine if we're using the legacy approach (intervalInMinutes) or new approach (date range)
  const isDateRangeMode = from && to;
  const isIntervalMode = intervalInMinutes !== undefined;

  if (!isDateRangeMode && !isIntervalMode) {
    throw new BadParameters('Either "intervalInMinutes" or both "from" and "to" dates must be provided');
  }

  if (isDateRangeMode && isIntervalMode) {
    throw new BadParameters('Cannot use both "intervalInMinutes" and date range ("from"/"to") at the same time');
  }

  let fromDate;
  let toDate;

  if (isDateRangeMode) {
    // New approach: using from/to dates
    fromDate = new Date(from);
    toDate = new Date(to);

    if (fromDate >= toDate) {
      throw new BadParameters('"from" date must be before "to" date');
    }

    // Offset in UTC
    fromDate.setMinutes(fromDate.getMinutes() - fromDate.getTimezoneOffset());
    toDate.setMinutes(toDate.getMinutes() - toDate.getTimezoneOffset());
  } else {
    // Legacy approach: using intervalInMinutes
    fromDate = new Date(Date.now() - intervalInMinutes * 60 * 1000);
    fromDate.setMinutes(fromDate.getMinutes() - fromDate.getTimezoneOffset());
  }

  let values;

  // Validate groupBy parameter if provided
  const validGroupByOptions = ['hour', 'day', 'week', 'month', 'year'];
  if (groupBy !== null && !validGroupByOptions.includes(groupBy)) {
    throw new BadParameters(`Invalid groupBy parameter. Must be one of: ${validGroupByOptions.join(', ')}`);
  }

  if (isBinary) {
    if (isDateRangeMode) {
      values = await db.duckDbReadConnectionAllAsync(
        BINARY_QUERY_DATE_RANGE,
        deviceFeature.id,
        fromDate,
        toDate,
        maxStates,
      );
    } else {
      values = await db.duckDbReadConnectionAllAsync(BINARY_QUERY, deviceFeature.id, fromDate, maxStates);
    }
  } else if (groupBy) {
    // Use the grouped query when groupBy is specified
    if (isDateRangeMode) {
      values = await db.duckDbReadConnectionAllAsync(
        GROUPED_QUERY_DATE_RANGE,
        groupBy,
        deviceFeature.id,
        fromDate,
        toDate,
      );
    } else {
      values = await db.duckDbReadConnectionAllAsync(GROUPED_QUERY, groupBy, deviceFeature.id, fromDate);
    }

    // Rename grouped_date to created_at for consistency with the existing API
    values = values.map((value) => ({
      ...value,
      created_at: value.grouped_date,
      count_value: Number(value.count_value),
    }));
  } else {
    // Use the original non-binary query when no groupBy is specified
    if (isDateRangeMode) {
      values = await db.duckDbReadConnectionAllAsync(
        NON_BINARY_QUERY_DATE_RANGE,
        maxStates,
        deviceFeature.id,
        fromDate,
        toDate,
      );
    } else {
      values = await db.duckDbReadConnectionAllAsync(NON_BINARY_QUERY, maxStates, deviceFeature.id, fromDate);
    }
    // Convert BigInt count_value to regular JavaScript Number
    values = values.map((value) => ({
      ...value,
      count_value: Number(value.count_value),
    }));
  }

  return {
    device: {
      name: device.name,
    },
    deviceFeature: {
      name: deviceFeature.name,
    },
    values,
  };
}

module.exports = {
  getDeviceFeaturesAggregates,
};
