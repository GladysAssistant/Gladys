const logger = require('../../utils/logger');

/**
 * @description Stop a running scene execution by its execution id.
 * @param {string} executionId - The id of the execution to stop.
 * @returns {boolean} True if a matching execution was found and stopped.
 * @example
 * sceneManager.stop('c1d2e3f4-...');
 */
function stop(executionId) {
  const runningScene = this.runningScenes.get(executionId);
  if (!runningScene) {
    return false;
  }
  logger.info(`Stopping scene execution ${executionId} (scene ${runningScene.sceneSelector}).`);
  runningScene.abortController.abort();
  return true;
}

/**
 * @description Stop all running executions of a scene by its selector.
 * @param {string} sceneSelector - The selector of the scene to stop.
 * @returns {number} The number of executions that were stopped.
 * @example
 * sceneManager.stopBySelector('my-scene');
 */
function stopBySelector(sceneSelector) {
  let stopped = 0;
  this.runningScenes.forEach((runningScene) => {
    if (runningScene.sceneSelector === sceneSelector) {
      runningScene.abortController.abort();
      stopped += 1;
    }
  });
  logger.info(`Stopped ${stopped} execution(s) of scene ${sceneSelector}.`);
  return stopped;
}

module.exports = {
  stop,
  stopBySelector,
};
