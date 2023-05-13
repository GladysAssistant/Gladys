const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const scenes = await db.Scene.findAll();
    logger.info(`Scene migration: Found ${scenes.length} scene`);

    await Promise.each(scenes, async (scene) => {
      let actionsModified = false;
      const updatedActions = await Promise.all(
        scene.actions.map(async (subactions) => {
          return Promise.all(
            subactions.map(async (action) => {
              if (
                action.type === 'switch.turn-on' ||
                action.type === 'switch.turn-off' ||
                action.type === 'switch.toggle' ||
                action.type === 'light.turn-on' ||
                action.type === 'light.turn-off' ||
                action.type === 'light.toggle'
              ) {
                let category;
                let type;
                if (action.type.startsWith('switch')) {
                  category = DEVICE_FEATURE_CATEGORIES.SWITCH;
                  type = DEVICE_FEATURE_TYPES.SWITCH.BINARY;
                } else if (action.type.startsWith('light')) {
                  category = DEVICE_FEATURE_CATEGORIES.LIGHT;
                  type = DEVICE_FEATURE_TYPES.LIGHT.BINARY;
                }
                if (action.devices) {
                  const devices = await Promise.all(
                    action.devices.map((deviceSelector) =>
                      db.Device.findOne({
                        where: {
                          selector: deviceSelector,
                        },
                      }),
                    ),
                  );

                  devices.forEach((device) => console.log(device));

                  const deviceIds = devices.filter((device) => device !== undefined).map((device) => device.id);
                  const deviceFeatures = await Promise.all(
                    deviceIds.map(async (deviceId) =>
                      db.DeviceFeature.findOne({
                        where: {
                          device_id: deviceId,
                          category,
                          type,
                        },
                      }),
                    ),
                  );
                  action.device_features = deviceFeatures.map((deviceFeature) => deviceFeature.selector);
                  delete action.devices;
                  actionsModified = true;
                }
              }
              return action;
            }),
          );
        }),
      );

      logger.info(`Scene migration: Updating scene ${scene.id} with new actions`);
      if (actionsModified) {
        scene.set({
          actions: updatedActions,
        });
        scene.changed('actions', true);
        await scene.save();
      }
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
