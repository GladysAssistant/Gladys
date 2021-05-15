const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

/**
 * @description Get list of media players.
 * @returns {Promise} Resolve with array of cameras.
 * @example
 * camera.get();
 */
async function get() {
  const players = await db.Device.findAll({
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
        attributes: ['name', 'selector'],
        where: {
          category: DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
        },
      },
      {
        model: db.Room,
        as: 'room',
        attributes: ['name', 'selector'],
      },
    ],
  });
  return players.map((player) => player.get({ plain: true }));
}

module.exports = {
  get,
};
