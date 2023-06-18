const Promise = require('bluebird');
const sequelize = require('sequelize');
const db = require('../models');

module.exports = {
  up: async () => {
    // Get Tasmota service
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'tasmota',
      },
    });
    if (service != null) {
      // Load impacted features
      const features = await db.DeviceFeature.findAll({
        where: {
          category: 'switch',
          type: ['energy', 'power', 'voltage'],
        },
        include: [
          {
            model: db.Device,
            as: 'device',
            where: {
              service_id: service.id,
            },
          },
        ],
      });

      await Promise.mapSeries(features, async (feature) => {
        const { id, type, name, last_value: value } = feature;

        // Modify energy current
        if (type === 'energy') {
          const currentFields = {
            category: 'energy-sensor',
            type: 'current',
          };

          if (name === 'Energy') {
            currentFields.name = 'Intensity';
          }

          await feature.update(currentFields);
        }

        // Modify energy power
        if (type === 'power') {
          const currentFields = {
            category: 'energy-sensor',
            unit: 'watt',
          };

          await feature.update(currentFields);
        }

        // Modify energy voltage
        if (type === 'voltage') {
          const currentFields = {
            category: 'energy-sensor',
            last_value: value * 1000,
          };

          await feature.update(currentFields);
          // Update feature states
          await db.DeviceFeatureState.update(
            {
              value: sequelize.literal('value * 1000'),
            },
            {
              where: {
                device_feature_id: id,
              },
            },
          );
          // Update feature aggregate
          await db.DeviceFeatureStateAggregate.update(
            {
              value: sequelize.literal('value * 1000'),
            },
            {
              where: {
                device_feature_id: id,
              },
            },
          );
        }
      });
    }
  },
  down: async () => {},
};
