const { Op } = require('sequelize');
const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

/**
 * @description Get image in room.
 * @param {string} roomId - Id of the room.
 * @returns {Promise} Resolve array with images.
 * @example
 * getImagesInRoom('f0dea887-d14f-4344-a57b-795c16e0abda');
 */
async function getImagesInRoom(roomId) {
  const oneHourAgo = new Date(new Date().getTime() - 1 * 60 * 60 * 1000);
  // Disabled cameras (spec docs/specs/camera-enable-disable.md) never expose their image,
  // even the last one stored before they were disabled.
  const disabledCameraFeatures = await db.DeviceFeature.findAll({
    attributes: ['device_id'],
    where: {
      category: DEVICE_FEATURE_CATEGORIES.CAMERA,
      type: DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
      last_value: 0,
    },
  });
  const where = {
    category: DEVICE_FEATURE_CATEGORIES.CAMERA,
    last_value_string: {
      [Op.not]: null,
    },
    last_value_changed: {
      // we want fresh value, less than 1h
      [Op.gt]: oneHourAgo,
    },
  };
  if (disabledCameraFeatures.length > 0) {
    where.device_id = {
      [Op.notIn]: disabledCameraFeatures.map((deviceFeature) => deviceFeature.device_id),
    };
  }
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
    where,
  });

  return deviceFeatures.map((deviceFeature) => deviceFeature.last_value_string);
}

module.exports = {
  getImagesInRoom,
};
