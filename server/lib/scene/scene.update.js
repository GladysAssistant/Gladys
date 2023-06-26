const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a scene.
 * @param {string} selector - The selector of the scene.
 * @param {object} scene - A scene object.
 * @returns {Promise} - Resolve with the scene.
 * @example
 * scene.update('my-scene', {
 *   name: 'my scene'
 * });
 */
async function update(selector, scene) {
  const existingScene = await db.Scene.findOne({
    where: {
      selector,
    },
  });

  if (existingScene === null) {
    throw new NotFoundError('Scene not found');
  }

  const oldName = existingScene.name;

  await existingScene.update(scene);

  const plainScene = existingScene.get({ plain: true });
  // Remove scene in brain if already present
  if (oldName !== plainScene.name) {
    this.brain.removeNamedEntity('scene', plainScene.selector, oldName);
  }
  // add scene to live store
  this.addScene(plainScene);
  // return updated scene
  return plainScene;
}

module.exports = {
  update,
};
