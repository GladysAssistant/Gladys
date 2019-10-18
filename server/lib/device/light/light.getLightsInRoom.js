const logger = require('../../../utils/logger');
const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

/**
 * @description Return a list of light devices in a room.
 * @param {string} roomId - The uuid of the room.
 * @returns {Promise<Array>} - Resolve with an array of devices.
 * @example
 * const lights = await getLightsInRoom('d65deccf-d8fc-4674-ac50-3d98d1d87aba');
 */
async function getLightsInRoom(roomId) {
  logger.debug(`Getting light devices in room ${roomId}`);

  const devices = await db.Device.findAll({
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
        where: {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        },
      },
      {
        model: db.Service,
        as: 'service',
      },
    ],
    where: {
      room_id: roomId,
    },
  });

  return devices.map((device) => device.get({ plain: true }));
}

module.exports = {
  getLightsInRoom,
};
