/**
 * @description Get the list of scenes currently being executed.
 * @returns {Array} List of running scene executions, oldest first.
 * @example
 * sceneManager.getRunning();
 */
function getRunning() {
  return Array.from(this.runningScenes.values())
    .map((runningScene) => ({
      executionId: runningScene.executionId,
      sceneSelector: runningScene.sceneSelector,
      name: runningScene.name,
      icon: runningScene.icon,
      startedAt: runningScene.startedAt,
    }))
    .sort((a, b) => a.startedAt - b.startedAt);
}

module.exports = {
  getRunning,
};
