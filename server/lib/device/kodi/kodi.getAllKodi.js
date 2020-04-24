const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const db = require('../../../models');

/**
 * @description Return a list of Kodi devices.
 * @returns {Promise<Array>} - Resolve with an array of devices.
 * @example
 * const kodis = await getAllKodi();
 */
async function getAllKodi() {
  logger.debug(`Getting all kodi devices`);

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
      selector: { [Op.like]: 'kodi%' },
    },
  });
  // logger.debug("Devices found: ", devices);
  return devices.map((device) => device.get({ plain: true }));
}

module.exports = {
  getAllKodi,
};
