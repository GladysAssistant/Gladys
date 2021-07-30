const { QueryTypes, Op, fn, col } = require('sequelize');
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
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const thirthyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);
  const thirthyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

  let type;
  let groupByFunction;

  if (intervalDate < sixMonthsAgo) {
    type = 'monthly';
    groupByFunction = fn('date', col('created_at'));
  } else if (intervalDate < fiveDaysAgo) {
    type = 'daily';
    groupByFunction = fn('date', col('created_at'));
    // groupByFunction = fn('strftime', '%Y-%m-%d %H:00:00', col('created_at'));
  } else if (intervalDate < thirthyHoursAgo) {
    type = 'hourly';
    groupByFunction = fn('strftime', '%Y-%m-%d %H:00:00', col('created_at'));
  } else {
    type = 'live';
  }

  console.log(type);

  let rows;

  console.time('sql');
  if (type === 'live') {
    rows = await db.DeviceFeatureState.findAll({
      raw: true,
      attributes: ['created_at', 'value'],
      logging: console.log,
      where: {
        device_feature_id: deviceFeature.id,
        created_at: {
          [Op.gte]: intervalDate,
        },
      },
    });
  } else {
    rows = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: [[groupByFunction, 'created_at'], [fn('round', fn('avg', col('value')), 2), 'value']],
      group: [groupByFunction],
      logging: console.log,
      where: {
        device_feature_id: deviceFeature.id,
        type,
        created_at: {
          [Op.gte]: intervalDate,
        },
      },
    });
  }

  console.log(rows);
  console.timeEnd('sql');

  const dataForDownsampling = rows.map((deviceFeatureState) => {
    return [new Date(deviceFeatureState.created_at), deviceFeatureState.value];
  });

  console.time('LTTB');
  const downsampled = LTTB(dataForDownsampling, maxStates);
  console.timeEnd('LTTB');

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
