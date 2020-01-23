const db = require('../../models');

/**
 * @description Load all triggers from the database to the trigger store.
 * @returns {Promise} Resolve when success.
 * @example
 * trigger.init();
 */
async function init() {
  const scenes = await db.Scene.findAll();
  const triggers = [];
  scenes.forEach((scene) => {
    const plainScene = scene.get({ plain: true });

    if (plainScene.triggers && plainScene.triggers instanceof Array) {
      plainScene.triggers.forEach((trigger) => {
        triggers.push(trigger);
      });
    }
  });
  triggers.forEach((trigger) => this.addToListeners(trigger));
  return triggers;
}

module.exports = {
  init,
};
