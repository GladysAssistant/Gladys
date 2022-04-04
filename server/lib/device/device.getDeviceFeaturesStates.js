const { Op } = require('sequelize');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get all features states aggregates.
 * @param {string} selector - Device selector.
 * @param {string} startInterval - Date of start.
 * @param {string} endInterval - Date of end.
 * @returns {Promise<Object>} - Resolve with an array of data.
 * @example
 * device.getDeviceFeaturesStates('test-device', 2022-03-31T00:00:00.000Z, 2022-03-31T23:59:59.999Z);
 */
async function getDeviceFeaturesStates(selector, startInterval, endInterval) {
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

  const dataRaw = rows.map((deviceFeatureState) => {
    return [new Date(deviceFeatureState.created_at), deviceFeatureState.value];
  });
  return {
    device: {
      name: device.name,
    },
    deviceFeature: {
      name: deviceFeature.name,
      selector: deviceFeature.selector,
      external_id: deviceFeature.external_id,
    },
    dataRaw,
  };
}

module.exports = {
  getDeviceFeaturesStates,
};
