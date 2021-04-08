const logger = require('../../../utils/logger');
const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

/**
 * @description Return a device that matches the id passed
 * @param {string} id - The uuid of the media player.
 * @returns {Promise<Object>} - Resolve with an array of devices.
 * @example
 * const player = await getDevice('d65deccf-d8fc-4674-ac50-3d98d1d87aba');
 */
async function getDevice(id) {
  logger.debug(`Getting media player device ${id}`);

  const device = await db.Device.findOne({
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
        where: {
          category: DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
        },
      },
      {
        model: db.Service,
        as: 'service',
      },
    ],
    where: {
      id,
    },
  });

  return device.get({ plain: true });
}

module.exports = {
  getDevice,
};
