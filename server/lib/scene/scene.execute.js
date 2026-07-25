const uuid = require('uuid');
const executeActionsFactory = require('./scene.executeActions');
const actionsFunc = require('./scene.actions');
const logger = require('../../utils/logger');
const { AbortScene } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

const { executeActions } = executeActionsFactory(actionsFunc);

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

    const executionId = uuid.v4();

    this.queue.push(async () => {
      const scene = this.scenes[sceneSelector];
      // if the scene was deleted while queued, do nothing
      if (!scene) {
        return;
      }
      const runningScene = {
        executionId,
        sceneSelector,
        name: scene.name,
        icon: scene.icon,
        startedAt: new Date(),
      };
      // register this execution so it can be listed while running
      this.runningScenes.set(executionId, runningScene);
      this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED,
        payload: runningScene,
      });
      try {
        await executeActions(this, scene.actions, scope);
      } catch (e) {
        if (e instanceof AbortScene) {
          logger.debug(e);
        } else {
          logger.error(e);
        }
      } finally {
        this.runningScenes.delete(executionId);
        this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED,
          payload: { executionId, sceneSelector },
        });
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
