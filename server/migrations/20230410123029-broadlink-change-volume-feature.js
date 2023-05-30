const Promise = require('bluebird');

const db = require('../models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tvDevices = await db.Device.findAll({
      include: [
        {
          model: db.DeviceFeature,
          as: 'features',
          where: {
            category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
            type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
          },
        },
        {
          model: db.Service,
          as: 'service',
          where: {
            name: 'broadlink',
          },
        },
        {
          model: db.DeviceParam,
          as: 'params',
        },
      ],
    });

    await Promise.each(tvDevices, async (device) => {
      // Update codes
      await Promise.each(device.params, async (param) => {
        const { name } = param;
        if (name === 'ir_code_volume-0') {
          await db.DeviceParam.update({ name: 'ir_code_volume-down' }, { where: { id: param.id } });
        } else if (name === 'ir_code_volume-2') {
          await db.DeviceParam.update({ name: 'ir_code_volume-up' }, { where: { id: param.id } });
        }
      });

      // Keep volume feature
      const featureIndex = device.features.findIndex(
        ({ category, type }) =>
          category === DEVICE_FEATURE_CATEGORIES.TELEVISION && type === DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
      );

      if (featureIndex >= 0) {
        // Get feature
        const volumeFeature = device.features[featureIndex];
        const { external_id: externalId, selector } = volumeFeature;

        // Add volume up/down features
        await Promise.each(
          [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN, DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP],
          async (volumeType) => {
            const featureExternalId = externalId.replace(/(volume)$/, `${volumeType}`);
            const featureSelector = selector.replace(/(volume)$/, `${volumeType}`);
            const feature = {
              device_id: device.id,
              name: `${volumeType}`,
              selector: featureSelector,
              external_id: featureExternalId,
              category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
              type: volumeType,
              read_only: false,
              keep_history: false,
              has_feedback: true,
              min: 0,
              max: 1,
            };

            await db.DeviceFeature.create(feature);
          },
        );

        // Delete existing feature
        await volumeFeature.destroy();
      }
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
