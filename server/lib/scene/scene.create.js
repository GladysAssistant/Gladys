const db = require('../../models');

/**
 * @description Create a new scene.
 * @param {object} scene - A scene object.
 * @returns {Promise} - Resolve with the created scene.
 * @example
 * scene.create({
 *   name: 'my scene'
 * });
 */
async function create(scene) {
  // create scene in DB
  const createdScene = await db.Scene.create(scene, {
    include: [
      {
        model: db.TagScene,
        as: 'tags',
        attributes: ['name'],
      },
    ],
  });

  const plainScene = createdScene.get({ plain: true });
  // add scene to live store
  this.addScene(plainScene);
  // return created scene
  return plainScene;
}

module.exports = {
  create,
};
