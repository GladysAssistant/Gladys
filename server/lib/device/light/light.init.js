const db = require('../../../models');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

/**
 * @description Get all lights and store them in memory.
 * @returns {Promise} Resolve with lights objects added.
 * @example
 * light.init();
 */
async function init() {
  const lights = await db.Device.findAll({
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
        where: {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
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
  logger.debug(`Light : init : Found ${lights.length} light devices`);
  const plainLights = lights.map((light) => {
    const device = light.get({ plain: true });
    const deviceWithFunctions = this.buildLightObject(device);
    this.deviceManager.add(deviceWithFunctions);
    return device;
  });
  return plainLights;
}

module.exports = {
  init,
};
