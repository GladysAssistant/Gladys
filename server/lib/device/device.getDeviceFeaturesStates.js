const { Op } = require('sequelize');
const { LTTB } = require('downsample');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get all features states aggregates.
 * @param {string} selector - Device selector.
 * @param {string} startInterval - Date of start.
 * @param {string} endInterval - Date of end.
 * @param {number} maxStates - Number of elements to return max.
 * @returns {Promise<Object>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesStates('test-device', 2022-03-31T01:13:45.190Z);
 */
async function getDeviceFeaturesStates(selector, startInterval, endInterval, maxStates = 100) {
  const deviceFeature = this.stateManager.get('deviceFeature', selector);
  if (deviceFeature === null) {
    throw new NotFoundError('DeviceFeature not found');
  }
  const device = this.stateManager.get('deviceById', deviceFeature.device_id);

  const startIntervalDate = new Date(startInterval).toISOString();
  const endIntervalDate = new Date(endInterval).toISOString();

  const rows = await db.DeviceFeatureState.findAll({
    raw: true,
    attributes: ['created_at', 'value'],
    where: {
      device_feature_id: deviceFeature.id,
      created_at: {
        [Op.gte]: startIntervalDate,
        [Op.lte]: endIntervalDate,
      },
    },
  });

  const dataForDownsampling = rows.map((deviceFeatureState) => {
    return [new Date(deviceFeatureState.created_at), deviceFeatureState.value];
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
