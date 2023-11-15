const Promise = require('bluebird');
const db = require('../models');

module.exports = {
  up: async () => {
    const scenes = await db.Scene.findAll();

    await Promise.each(scenes, async (scene) => {
      scene.icon = await db.Scene.update(
        {
          icon: `fe fe-${scene.icon}`,
        },
        {
          where: {
            id: scene.id,
          },
        },
      );
    });
  },

  down: async () => {},
};
