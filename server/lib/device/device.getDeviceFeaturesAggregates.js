const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

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

  const now = new Date();
  const intervalDate = new Date(now.getTime() - intervalInMinutes * 60 * 1000);

  const values = await db.duckDbReadConnectionAllAsync(
    `
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
  `,
    maxStates,
    deviceFeature.id,
    intervalDate,
  );

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
