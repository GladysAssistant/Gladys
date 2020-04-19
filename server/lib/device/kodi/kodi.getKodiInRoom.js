const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const db = require('../../../models');

/**
 * @description Return a list of Kodi devices in a room.
 * @param {string} roomId - The uuid of the room.
 * @returns {Promise<Array>} - Resolve with an array of devices.
 * @example
 * const kodis = await getKodiInRoom('d65deccf-d8fc-4674-ac50-3d98d1d87aba');
 */
async function getKodiInRoom(roomId) {
  logger.debug(`Getting kodi devices in room ${roomId}`);

  const devices = await db.Device.findAll({
    include: [
      {
        model: db.DeviceParam,
        as: 'params',
      },
    ],
    where: {
      selector: { [Op.like]: 'kodi%'},
      room_id: roomId,
    },
  });
  // logger.debug('Devices found: ', devices);
  return devices.map((device) => device.get({ plain: true }));
}

module.exports = {
  getKodiInRoom,
};
