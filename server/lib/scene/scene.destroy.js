const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Destroy a scene
 * @param {string} selector - The selector of the scene.
 * @example
 * scene.destroy('my-scene');
 */
async function destroy(selector) {
  const existingScene = await db.Scene.findOne({
    where: {
      selector,
    },
  });

  if (existingScene === null) {
    throw new NotFoundError('Scene not found');
  }

  await existingScene.destroy();
  // we cancel triggers linked to the scene
  this.cancelTriggers(selector);
  // then we delete the scene in RAM
  delete this.scenes[selector];
}

module.exports = {
  destroy,
};
