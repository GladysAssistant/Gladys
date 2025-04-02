const db = require('../../models');
const { slugify } = require('../../utils/slugify');

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
  let sceneWithSelector = scene;
  if (!scene.selector) {
    // add selector with random characters if no selector is passed
    sceneWithSelector = {
      ...scene,
      selector: slugify(scene.name, true),
    };
  }
  // create scene in DB
  const createdScene = await db.Scene.create(sceneWithSelector, {
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
