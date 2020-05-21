const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Destroy a device by selectr pattern.
 * @param {string} selector - Device selector patter.
 * @example
 * device.destroyBySelectorPattern('test');
 */
async function destroyBySelectorPattern(selector) {
  const devices = await db.Device.findAll({
    include: [
      {
        model: db.DeviceParam,
        as: 'params',
      },
      {
        model: db.DeviceFeature,
        as: 'features',
      },
    ],
    where: {
      selector: { [Op.like]: `${selector}%` },
    },
  });

  devices.map(async (device) => {
    device.destroy();
  });

  return null;
}

module.exports = {
  destroyBySelectorPattern,
};
