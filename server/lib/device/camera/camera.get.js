const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

/**
 * @description Get list of cameras.
 * @returns {Promise} Resolve with array of cameras.
 * @example
 * camera.get();
 */
async function get() {
  const cameras = await db.Device.findAll({
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
        attributes: ['name', 'selector'],
        where: {
          category: DEVICE_FEATURE_CATEGORIES.CAMERA,
        },
      },
      {
        model: db.Room,
        as: 'room',
        attributes: ['name', 'selector'],
      },
    ],
  });
  return cameras.map((camera) => camera.get({ plain: true }));
}

module.exports = {
  get,
};
