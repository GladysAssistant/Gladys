const db = require('../../models');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const logger = require('../../utils/logger');
/**
 * @description Load all scenes from the database to the trigger store.
 * @returns {Promise} Resolve when success.
 * @example
 * scene.init();
 */
async function init() {
  logger.debug('Scene.init');
  // get timezone settings
  const timezone = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  if (timezone) {
    this.timezone = timezone;
  }
  // get all scenes
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
