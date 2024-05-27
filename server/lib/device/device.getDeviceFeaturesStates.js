const { Op, fn, col, literal } = require('sequelize');
const { LTTB } = require('downsample');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

dayjs.extend(utc);

/**
 * @description Get all features states.
 * @param {string} selector - Device selector.
 * @param {number} intervalInMinutes - Interval.
 * @param {number} maxStates - Number of elements to return max.
 * @param {Date} startDate - Start date.
 * @param {Date} endDate - End date.
 * @returns {Promise<object>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesStates('test-device');
 */
async function getDeviceFeaturesStates(selector, intervalInMinutes, maxStates = 10000, startDate = null, endDate = null) {
  const deviceFeature = this.stateManager.get('deviceFeature', selector);
  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const device = this.stateManager.get('deviceById', deviceFeature.device_id);

  const now = new Date();
  let intervalDate;
  if (startDate === null && endDate === null) {
    intervalDate = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
  } else if (startDate !== null && endDate === null) {
    intervalDate = new Date(new Date(startDate).getTime() + intervalInMinutes * 60 * 1000);
    endDate = intervalDate;
  } else if (startDate === null && endDate !== null) {
    intervalDate = new Date(new Date(endDate).getTime() - intervalInMinutes * 60 * 1000);
    startDate = intervalDate;
    intervalDate = new Date(endDate);
  } else {
    intervalDate = new Date(startDate);
  }

  let rows;

  const whereClause = {
    device_feature_id: deviceFeature.id,
    created_at: {
      [Op.gte]: startDate ? new Date(startDate) : intervalDate,
    },
  };

  if (endDate) {
    whereClause.created_at[Op.lte] = new Date(endDate);
  }

  rows = await db.DeviceFeatureState.findAll({
    raw: true,
    attributes: ['created_at', 'value'],
    where: whereClause,
  });

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
  getDeviceFeaturesStates,
};
