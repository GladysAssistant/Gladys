const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  USER_ROLE,
  AVAILABLE_LANGUAGES,
} = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // We look if there is a french admin user in this integration
    const frenchAdminUser = await db.User.findOne({
      where: {
        language: AVAILABLE_LANGUAGES.FR,
        role: USER_ROLE.ADMIN,
      },
    });
    // If no, we don't rename anything
    if (frenchAdminUser === null) {
      return;
    }
    logger.info(
      `Enedis migration: Admin ${frenchAdminUser.email} has language in french. Converting possible Enedis devices.`,
    );
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
      logger.info(`Enedis migration: Updating device_feature ${deviceFeature.id} with new name translated`);
      deviceFeature.set({
        name: 'Consommation quotidienne',
      });
      await deviceFeature.save();
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
