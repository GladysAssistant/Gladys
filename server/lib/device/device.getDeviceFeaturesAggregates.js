const { QueryTypes } = require('sequelize');
const { LTTB } = require('downsample');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get all features states aggregates.
 * @param {string} selector - Device selector.
 * @param {number} intervalInMinutes - Interval.
 * @param {number} maxStates - Number of elements to return max.
 * @returns {Promise<Array>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-devivce');
 */
async function getDeviceFeaturesAggregates(selector, intervalInMinutes, maxStates = 100) {
  const deviceFeature = await db.DeviceFeature.findOne({
    where: {
      selector,
    },
  });

  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }

  const now = new Date();
  const intervalDate = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
  const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirthyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db.sequelize.query(
    `
        SELECT created_at, value FROM (
            SELECT created_at, value
            FROM t_device_feature_state
            WHERE device_feature_id = :deviceFeatureId
            AND created_at > DATETIME(:sixtyMinutesAgo)
            AND created_at > DATETIME(:intervalDate)

            UNION ALL

            SELECT created_at, value
            FROM t_device_feature_state_aggregate
            WHERE type = 'hourly'
            AND device_feature_id = :deviceFeatureId
            AND created_at < DATETIME(:sixtyMinutesAgo)
            AND created_at > DATETIME(:twentyFourHoursAgo)
            AND created_at > DATETIME(:intervalDate)

            UNION ALL

            SELECT created_at, value
            FROM t_device_feature_state_aggregate
            WHERE type = 'daily'
            AND device_feature_id = :deviceFeatureId
            AND created_at < DATETIME(:twentyFourHoursAgo)
            AND created_at > DATETIME(:thirthyDaysAgo)
            AND created_at > DATETIME(:intervalDate)

            UNION ALL

            SELECT created_at, value
            FROM t_device_feature_state_aggregate
            WHERE type = 'monthly'
            AND device_feature_id = :deviceFeatureId
            AND created_at < DATETIME(:thirthyDaysAgo)
            AND created_at > DATETIME(:intervalDate)
        ) as subquery
        ORDER BY created_at ASC
    `,
    {
      replacements: {
        deviceFeatureId: deviceFeature.id,
        intervalDate,
        sixtyMinutesAgo,
        twentyFourHoursAgo,
        thirthyDaysAgo,
      },
      raw: true,
      type: QueryTypes.SELECT,
    },
  );
  const dataForDownsampling = rows.map((deviceFeatureState) => {
    return [new Date(deviceFeatureState.created_at), deviceFeatureState.value];
  });

  const downsampled = LTTB(dataForDownsampling, maxStates);

  // @ts-ignore
  return downsampled.map((e) => {
    return {
      created_at: e[0],
      value: e[1],
    };
  });
}

module.exports = {
  getDeviceFeaturesAggregates,
};
