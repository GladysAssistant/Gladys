const { Op, fn, col, literal } = require('sequelize');
const { LTTB } = require('downsample');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

dayjs.extend(utc);

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
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const thirthyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);
  const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

  let type;
  let groupByFunction;

  if (intervalDate < sixMonthsAgo) {
    type = 'monthly';
    groupByFunction = fn('date', col('created_at'));
  } else if (intervalDate < fiveDaysAgo) {
    type = 'daily';
    groupByFunction = fn('date', col('created_at'));
  } else if (intervalDate < thirthyHoursAgo) {
    type = 'hourly';
    groupByFunction = fn('strftime', '%Y-%m-%d %H:00:00', col('created_at'));
  } else if (intervalDate < tenHoursAgo) {
    type = 'hourly';
    // this will extract date rounded to the 5 minutes
    // So if the user queries 24h, he'll get 24 * 12 = 288 items
    groupByFunction = literal(`datetime(strftime('%s', created_at) - strftime('%s', created_at) % 300, 'unixepoch')`);
  } else {
    type = 'live';
  }

  let rows;

  if (type === 'live') {
    rows = await db.DeviceFeatureState.findAll({
      raw: true,
      attributes: ['created_at', 'value'],
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
      attributes: [
        [groupByFunction, 'created_at'],
        [fn('round', fn('avg', col('value')), 2), 'value'],
      ],
      group: [groupByFunction],
      where: {
        device_feature_id: deviceFeature.id,
        type,
        created_at: {
          [Op.gte]: intervalDate,
        },
      },
    });
  }

  const dataForDownsampling = rows.map((deviceFeatureState) => {
    return [dayjs.utc(deviceFeatureState.created_at), deviceFeatureState.value];
  });

  const downsampled = LTTB(dataForDownsampling, maxStates);

  // @ts-ignore
  const values = downsampled.map((e) => {
    return {
      created_at: e[0],
      value: e[1],
    };
  });

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
