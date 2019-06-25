const { Op } = require('sequelize');
const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

/**
 * @description Get image in room.
 * @param {string} roomId - Id of the room.
 * @returns {Promise} Resolve with the image.
 * @example
 * getImageInRoom('f0dea887-d14f-4344-a57b-795c16e0abda');
 */
async function getImageInRoom(roomId) {
  const oneHourAgo = new Date(new Date().getTime() - 1 * 60 * 60 * 1000);
  const deviceFeatures = await db.DeviceFeature.findAll({
    attributes: ['last_value_string'],
    include: [
      {
        model: db.Device,
        as: 'device',
        where: {
          room_id: roomId,
        },
      },
    ],
    where: {
      category: DEVICE_FEATURE_CATEGORIES.CAMERA,
      last_value_string: {
        [Op.not]: null,
      },
      last_value_changed: {
        // we want fresh value, less than 1h
        [Op.gt]: oneHourAgo,
      },
    },
  });

  if (deviceFeatures.length === 0) {
    return null;
  }

  return deviceFeatures[0].last_value_string;
}

module.exports = {
  getImageInRoom,
};
