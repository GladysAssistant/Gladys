const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

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
        AVG(value) AS value
    FROM
        intervals
    GROUP BY
        interval
    ORDER BY
        created_at;
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

/**
 * @description Get all features states aggregates.
 * @param {string} selector - Device selector.
 * @param {number} intervalInMinutes - Interval.
 * @param {number} maxStates - Number of elements to return max.
 * @returns {Promise<object>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-devivce');
 */
async function getDeviceFeaturesAggregates(selector, intervalInMinutes, maxStates = 100) {
  const deviceFeature = this.stateManager.get('deviceFeature', selector);
  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const device = this.stateManager.get('deviceById', deviceFeature.device_id);

  const isBinary = ['binary', 'push'].includes(deviceFeature.type);

  const now = new Date();
  const intervalDate = new Date(now.getTime() - intervalInMinutes * 60 * 1000);

  let values;

  if (isBinary) {
    values = await db.duckDbReadConnectionAllAsync(BINARY_QUERY, deviceFeature.id, intervalDate, maxStates);
  } else {
    values = await db.duckDbReadConnectionAllAsync(NON_BINARY_QUERY, maxStates, deviceFeature.id, intervalDate);
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
