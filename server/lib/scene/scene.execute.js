const { executeActions } = require('./scene.executeActions');
const logger = require('../../utils/logger');

/**
 * @description Execute a scene by its selector.
 * @param {string} sceneSelector - The selector of the scene to execute.
 * @param {Object} [scope] - The scope of the event triggering the scene.
 * @example
 * sceneManager.execute('test');
 */
function execute(sceneSelector, scope) {
  try {
    if (!this.scenes[sceneSelector]) {
      throw new Error(`Scene with selector ${sceneSelector} not found.`);
    }
    this.queue.push(() => executeActions(this, this.scenes[sceneSelector].actions, scope));
  } catch (e) {
    logger.error(e);
  }
  return null;
}

module.exports = {
  execute,
};
