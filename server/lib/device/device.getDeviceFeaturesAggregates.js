const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get all features states aggregates.
 * @param {string} selector - Device selector.
 * @param {number} intervalInMinutes - Interval.
 * @param {number} maxStates - Number of elements to return max.
 * @param {Date} startDate - Start date.
 * @param {Date} endDate - End date.
 * @returns {Promise<object>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-device');
 */
async function getDeviceFeaturesAggregates(
  selector,
  intervalInMinutes,
  maxStates = 100,
  startDate = null,
  endDate = null,
) {
  const deviceFeature = this.stateManager.get('deviceFeature', selector);
  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const device = this.stateManager.get('deviceById', deviceFeature.device_id);

  const now = new Date();
  // const intervalDate = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
  let intervalDate;
  let newStartDate = startDate;
  let newEndDate = endDate;
  if (startDate === null && endDate === null) {
    intervalDate = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
  } else if (startDate !== null && endDate === null) {
    intervalDate = new Date(new Date(startDate).getTime() + intervalInMinutes * 60 * 1000);
    newEndDate = intervalDate;
    intervalDate = new Date(startDate);
  } else if (startDate === null && endDate !== null) {
    intervalDate = new Date(new Date(endDate).getTime() - intervalInMinutes * 60 * 1000);
    newStartDate = intervalDate;
    intervalDate = new Date(endDate);
  } else {
    intervalDate = new Date(startDate);
  }

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
        ${startDate ? 'AND created_at >= ?' : ''}
        ${endDate ? 'AND created_at <= ?' : ''}
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
    ...[
      maxStates,
      deviceFeature.id,
      intervalDate,
      ...(startDate ? [new Date(startDate)] : []),
      ...(endDate ? [new Date(endDate)] : [])
    ]
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
