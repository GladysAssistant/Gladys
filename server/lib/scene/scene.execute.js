const { executeActions } = require('./scene.executeActions');
const logger = require('../../utils/logger');
const { AbortScene } = require('../../utils/coreErrors');

/**
 * @description Execute a scene by its selector.
 * @param {string} sceneSelector - The selector of the scene to execute.
 * @param {object} [scope] - The scope of the event triggering the scene.
 * @returns {Promise} Resolve when scene was executed.
 * @example
 * sceneManager.execute('test');
 */
function execute(sceneSelector, scope = {}) {
  try {
    if (!this.scenes[sceneSelector]) {
      throw new Error(`Scene with selector ${sceneSelector} not found.`);
    }

    scope.alreadyExecutedScenes = scope.alreadyExecutedScenes || new Set();
    scope.alreadyExecutedScenes.add(sceneSelector);

    this.queue.push(async () => {
      try {
        await executeActions(this, this.scenes[sceneSelector].actions, scope);
      } catch (e) {
        if (e instanceof AbortScene) {
          logger.debug(e);
        } else {
          logger.error(e);
        }
      }
    });
  } catch (e) {
    logger.error(e);
  }
  return null;
}

module.exports = {
  execute,
};
