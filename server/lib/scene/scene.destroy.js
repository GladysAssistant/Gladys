const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Destroy a scene.
 * @param {string} selector - The selector of the scene.
 * @example
 * scene.destroy('my-scene');
 */
async function destroy(selector) {
  const existingScene = await db.Scene.findOne({
    where: {
      selector,
    },
    include: [
      {
        model: db.TagScene,
        as: 'tags',
        attributes: ['name'],
      },
    ],
  });

  if (existingScene === null) {
    throw new NotFoundError('Scene not found');
  }

  // Remove scene from brain
  this.brain.removeNamedEntity('scene', existingScene.selector, existingScene.name);

  await db.TagScene.destroy({
    where: {
      scene_id: existingScene.id,
    },
  });

  await existingScene.destroy();
  // we cancel triggers linked to the scene
  this.cancelTriggers(selector);
  // then we delete the scene in RAM
  delete this.scenes[selector];
}

module.exports = {
  destroy,
};
