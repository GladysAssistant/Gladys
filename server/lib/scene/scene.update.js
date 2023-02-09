const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a scene
 * @param {string} selector - The selector of the scene.
 * @param {Object} scene - A scene object.
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

  let oldName = existingScene.name;

  if (existingScene === null) {
    throw new NotFoundError('Scene not found');
  }

  await existingScene.update(scene);

  const plainScene = existingScene.get({ plain: true });
  // add scene to live store
  this.addScene(plainScene);
  // update scene in brain
  if (oldName !== plainScene.name) {
    this.brain.removeNamedEntity('scene', plainScene.selector, oldName);
    this.brain.addNamedEntity('scene', plainScene.selector, plainScene.name);
  }
  // return updated scene
  return plainScene;
}

module.exports = {
  update,
};
