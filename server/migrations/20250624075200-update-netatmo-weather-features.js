const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get Netatmo service
    const service = await db.Service.findOne({
      where: {
        name: 'netatmo',
      },
    });
    if (service === null) {
      logger.info('Netatmo service not found.');
      return;
    }
    logger.info(`Netatmo migration: Found service netatmo = ${service.id}`);

    const netatmoDevices = await db.Device.findAll({
      where: {
        service_id: service.id,
        model: {
          [Sequelize.Op.or]: ['NAModule1', 'NAMain', 'NAModule4'],
        },
      },
    });
    logger.info(`Netatmo migration: Found ${netatmoDevices.length} netatmo devices`);

    await Promise.each(netatmoDevices, async (netatmoDevice) => {
      // Load impacted features
      const features = await db.DeviceFeature.findAll({
        where: {
          device_id: netatmoDevice.id,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          external_id: {
            [Sequelize.Op.or]: [{ [Sequelize.Op.like]: '%:min_temp%' }, { [Sequelize.Op.like]: '%:max_temp%' }],
          },
        },
      });
      logger.info(`Netatmo migration: Found ${features.length} netatmo features`);

      await Promise.mapSeries(features, async (feature) => {
        const { id, external_id: externalId } = feature;

        // Modify min_temp
        if (externalId.includes('min_temp')) {
          const currentFields = {
            type: DEVICE_FEATURE_TYPES.TEMPERATURE_SENSOR.MIN,
          };

          await feature.update(currentFields);
          logger.info(`Netatmo migration: Updating device_feature ${id}`);
        }

        // Modify max_temp
        if (externalId.includes('max_temp')) {
          const currentFields = {
            type: DEVICE_FEATURE_TYPES.TEMPERATURE_SENSOR.MAX,
          };

          await feature.update(currentFields);
          logger.info(`Netatmo migration: Updating device_feature ${id}`);
        }
      });
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
