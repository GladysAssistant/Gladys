const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const db = require('../../../models');

/**
 * @description Return default Kodi devices .
 * @returns {Promise<Array>} - Resolve with an array of devices.
 * @example
 * const kodis = await getKodiDefault();
 */
async function getKodiDefault() {
  logger.debug(`Getting default kodi devices`);

  const deviceIds = await db.DeviceParam.findAll({
    attributes: ['device_id'],
    include: [
      {
        model: db.Device,
        as: 'device',
      },
    ],
    where: {
      '$device.selector$': { [Op.like]: 'kodi%' },
      name: 'default',
      value: 'true',
    },
  });

  logger.debug('DeviceIds: ', deviceIds);

  if (deviceIds) {
    const devices = await db.Device.findAll({
      include: [
        {
          model: db.DeviceParam,
          as: 'params',
        },
      ],
      where: {
        id: deviceIds[0].dataValues.device_id,
      },
    });
    // logger.debug("Devices found: ", devices);
    return devices.map((device) => device.get({ plain: true }));
  }
  return null;
}

module.exports = {
  getKodiDefault,
};
