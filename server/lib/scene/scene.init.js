const db = require('../../models');

/**
 * @description Load all scenes from the database to the trigger store.
 * @returns {Promise} Resolve when success.
 * @example
 * scene.init();
 */
async function init() {
  const scenes = await db.Scene.findAll();
  const plainScenes = scenes.map((scene) => {
    const plainScene = scene.get({ plain: true });
    this.addScene(plainScene);
    return plainScene;
  });
  return plainScenes;
}

module.exports = {
  init,
};
