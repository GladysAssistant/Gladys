const Promise = require('bluebird');
const db = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await db.sequelize.transaction(async (transaction) => {
      const service = await db.Service.findOne({
        where: {
          selector: 'sonoff',
        },
      });

      if (service) {
        // Update service name and selector
        await service.update({ name: 'tasmota', selector: 'tasmota' }, { transaction });

        const devices = await db.Device.findAll({
          where: {
            service_id: service.id,
          },
        });

        // Update devices external_id and selector
        await Promise.map(devices, async (device) => {
          const realDevice = device.get({ plain: true });

          // Update features external_id and selector
          const dbFeatures = await db.DeviceFeature.findAll({
            where: {
              device_id: realDevice.id,
            },
          });
          await Promise.map(dbFeatures, async (dbFeature) => {
            const newExternalId = dbFeature.external_id.replace(/^sonoff/, 'tasmota');
            const selector = dbFeature.selector.replace(/^sonoff/, 'tasmota');
            await dbFeature.update({ external_id: newExternalId, selector }, { transaction });
          });

          const newExternalId = realDevice.external_id.replace(/^sonoff/, 'tasmota');
          const selector = realDevice.selector.replace(/^sonoff/, 'tasmota');
          await device.update({ external_id: newExternalId, selector }, { transaction });
        });
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await db.sequelize.transaction(async (transaction) => {
      const service = await db.Service.findOne({
        where: {
          name: 'tasmota',
        },
      });

      if (service) {
        // Update service name and selector
        await service.update({ name: 'sonoff', selector: 'sonoff' }, { transaction });

        const devices = await db.Device.findAll({
          where: {
            service_id: service.id,
          },
        });

        // Update devices external_id and selector
        await Promise.map(devices, async (device) => {
          const realDevice = device.get({ plain: true });

          // Update features external_id and selector
          const dbFeatures = await db.DeviceFeature.findAll({
            where: {
              device_id: realDevice.id,
            },
          });
          await Promise.map(dbFeatures, async (dbFeature) => {
            const newExternalId = dbFeature.external_id.replace(/^tasmota/, 'sonoff');
            const selector = dbFeature.selector.replace(/^tasmota/, 'sonoff');
            await dbFeature.update({ external_id: newExternalId, selector }, { transaction });
          });

          const newExternalId = realDevice.external_id.replace(/^tasmota/, 'sonoff');
          const selector = realDevice.selector.replace(/^tasmota/, 'sonoff');
          await device.update({ external_id: newExternalId, selector }, { transaction });
        });
      }
    });
  },
};
