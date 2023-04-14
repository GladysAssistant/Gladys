const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const service = await db.Service.findOne({
      where: {
        name: 'enedis',
      },
    });
    if (service === null) {
      return;
    }
    logger.info(`Enedis migration: Found service enedis = ${service.id}`);
    const enedisDevices = await db.Device.findAll({
      where: {
        service_id: service.id,
      },
    });
    logger.info(`Enedis migration: Found ${enedisDevices.length} enedis devices`);
    await Promise.each(enedisDevices, async (enedisDevice) => {
      const deviceFeature = await db.DeviceFeature.findOne({
        where: {
          device_id: enedisDevice.id,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
        },
      });
      if (deviceFeature === null) {
        return;
      }
      logger.info(`Enedis migration: Updating device_feature ${deviceFeature.id} with new unit`);
      deviceFeature.set({
        unit: DEVICE_FEATURE_UNITS.WATT_HOUR,
      });
      await deviceFeature.save();
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
