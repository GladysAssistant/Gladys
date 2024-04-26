const Promise = require('bluebird');
const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');

module.exports = {
  up: async (Sequelize) => {
    const scenes = await db.Scene.findAll({
      where: {
        actions: {
          [Op.substring]: 'light.blink',
        },
      },
    });

    logger.info(`Scene migration: Found ${scenes.length} scenes with light.blink action`);
    await Promise.each(scenes, async (scene) => {
      scene.actions.forEach((actionGroup) => {
        actionGroup.forEach((action) => {
          if (action.type === 'light.blink') {
            logger.info(`Scene migration: Updating action ${action.type} with device.blink`);
            action.type = 'device.blink';
          }
        });
      });
      logger.info(`Scene migration: Saving updated scene ${scene.name}`);
      await scene.save({ fields: ['actions'] });
    });
  },
  down: async (Sequelize) => {
    const scenes = await db.Scene.findAll({
      where: {
        actions: {
          [Op.substring]: 'device.blink',
        },
      },
    });
    logger.info(`Scene migration: Found ${scenes.length} scenes with device.blink action`);
    await Promise.each(scenes, async (scene) => {
      scene.actions.forEach((actionGroup) => {
        actionGroup.forEach((action) => {
          if (action.type === 'device.blink') {
            logger.info(`Scene migration: Updating action ${action.type} with light.blink`);
            action.type = 'light.blink';
          }
        });
      });
      logger.info(`Scene migration: Saving updated scene ${scene.name}`);
      await scene.save({ fields: ['actions'] });
    });
  },
};
