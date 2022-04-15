const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Duplicate a scene.
 * @param {string} selector - The selector of the source scene.
 * @param {string} name - The name of the duplicated scene.
 * @returns {Promise} - Resolve with the scene.
 * @example
 * duplicateScene({
 *  selector: 'test'
 * });
 */
async function duplicate(selector, name) {
  const existingScene = await db.Scene.findOne({
    where: {
      selector,
    },
  });

  if (existingScene === null) {
    throw new NotFoundError('Scene not found');
  }

  const plainExistingScene = existingScene.get({ plain: true });

  const newScene = {
    name,
    icon: plainExistingScene.icon,
    active: plainExistingScene.active,
    actions: plainExistingScene.actions,
    triggers: plainExistingScene.triggers,
  };

  const createdScene = await db.Scene.create(newScene);
  const plainScene = createdScene.get({ plain: true });
  // add scene to live store
  this.addScene(plainScene);
  // return created scene
  return plainScene;
}

module.exports = {
  duplicate,
};
