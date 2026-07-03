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
 * @param {number} intervalInMinutes - Interval.
 * @param {number} [maxStates] - Number of elements to return max.
 * @param {string} [groupBy] - Group results by time period ('hour', 'day', 'week', 'month', 'year').
 * @param {number} [offsetInMinutes] - Offset in minutes from now for the end of the interval.
 * @returns {Promise<object>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-devivce');
 */
function getIntervalDates(intervalInMinutes, offsetInMinutes = 0) {
  const endDate = new Date(Date.now() - offsetInMinutes * 60 * 1000);
  endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());

  const startDate = new Date(Date.now() - (offsetInMinutes + intervalInMinutes) * 60 * 1000);
  startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());

  return { startDate, endDate };
}

async function getDeviceFeaturesAggregates(
  selector,
  intervalInMinutes,
  maxStates = 100,
  groupBy = null,
  offsetInMinutes = 0,
) {
  const deviceFeature = this.stateManager.get('deviceFeature', selector);
  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const device = this.stateManager.get('deviceById', deviceFeature.device_id);

  const isBinary = ['binary', 'push'].includes(deviceFeature.type);

  if (offsetInMinutes < 0) {
    throw new BadParameters('Invalid offset parameter. Must be a positive number.');
  }

  const { startDate, endDate } = getIntervalDates(intervalInMinutes, offsetInMinutes);

  let values;

  // Validate groupBy parameter if provided
  const validGroupByOptions = ['hour', 'day', 'week', 'month', 'year'];
  if (groupBy !== null && !validGroupByOptions.includes(groupBy)) {
    throw new BadParameters(`Invalid groupBy parameter. Must be one of: ${validGroupByOptions.join(', ')}`);
  }

  if (isBinary) {
    values = await db.duckDbReadConnectionAllAsync(
      BINARY_QUERY,
      deviceFeature.id,
      startDate,
      endDate,
      maxStates,
    );
  } else if (groupBy) {
    // Use the grouped query when groupBy is specified
    values = await db.duckDbReadConnectionAllAsync(GROUPED_QUERY, groupBy, deviceFeature.id, startDate, endDate);

    // Rename grouped_date to created_at for consistency with the existing API
    values = values.map((value) => ({
      ...value,
      created_at: value.grouped_date,
      count_value: Number(value.count_value),
    }));
  } else {
    // Use the original non-binary query when no groupBy is specified
    values = await db.duckDbReadConnectionAllAsync(NON_BINARY_QUERY, maxStates, deviceFeature.id, startDate, endDate);
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
  getIntervalDates,
};
