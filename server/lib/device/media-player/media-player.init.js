const db = require('../../../models');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

/**
 * @description Get all media players and store them in memory.
 * @returns {Promise} Resolve with media player objects added.
 * @example
 * mediaPlayer.init();
 */
async function init() {
  const players = await db.Device.findAll({
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
        where: {
          category: DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER,
        },
      },
      {
        model: db.Room,
        as: 'room',
      },
      {
        model: db.Service,
        as: 'service',
      },
    ],
  });
  logger.debug(`Media player : init : Found ${players.length} media player devices`);
  const plainPlayers = players.map((player) => {
    const device = player.get({ plain: true });
    const deviceWithFunctions = this.buildMediaPlayerObject(device);
    this.deviceManager.add(deviceWithFunctions);
    return device;
  });
  return plainPlayers;
}

module.exports = {
  init,
};
