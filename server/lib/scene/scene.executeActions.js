const Promise = require('bluebird');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { AbortScene } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

module.exports = (actionsFunc) => {
  /**
   * @description Execute one action.
   * @param {object} self - Reference to the SceneManager.
   * @param {object} action - An Action from the db.
   * @param {object} scope - The scope passed to all actions.
   * @param {string} path - The path of the action in the scene JSON.
   * @param {object} [options={}] - Additional options.
   * @param {boolean} [options.throwUnknownError=false] - Throw an error if an unknown error happens.
   * @returns {Promise} Resolve if the action was executed with success.
   * @example
   * executeAction(this, action, {});
   */
  async function executeAction(self, action, scope, path, { throwUnknownError = false } = {}) {
    logger.debug(`Executing action ${action.type}`);
    if (!actionsFunc[action.type]) {
      throw new Error(`Action type "${action.type}" does not exist.`);
    }

    // send message to tell UI the action is executed
    if (path !== undefined) {
      self.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.SCENE.EXECUTING_ACTION,
        payload: { path },
      });
    }
    try {
      // execute action
      await actionsFunc[action.type](self, action, scope, path);
    } catch (e) {
      if (e instanceof AbortScene) {
        throw e;
      } else {
        if (throwUnknownError) {
          throw e;
        }
        logger.warn(e);
      }
    }

    // send message to tell the UI the action has finished being executed
    if (path !== undefined) {
      self.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.SCENE.FINISHED_EXECUTING_ACTION,
        payload: { path },
      });
    }

    return null;
  }

  /**
   * @description Execute an array of array of action.
   * @param {object} self - Reference to the SceneManager.
   * @param {object} actions - An array of array of actions from the db.
   * @param {object} scope - The scope passed to all actions.
   * @param {string} [basePath] - If this group of actions is executed inside a branch.
   * @param {object} [options] - Additional options.
   * @param {boolean} [options.throwUnknownError=false] - Throw an error if an unknown error happens.
   * @returns {Promise} Resolve if the action was executed with success.
   * @example
   * executeActions(this, actions, {});
   */
  async function executeActions(self, actions, scope, basePath = null, { throwUnknownError = false } = {}) {
    // first array level should be executed in serie
    await Promise.mapSeries(actions, async (parallelActions, columnIndex) => {
      // then, second level is executed in parallel
      await Promise.map(parallelActions, async (action, rowIndex) => {
        const path = `${basePath ? `${basePath}.` : ''}${columnIndex}.${rowIndex}`;
        await executeAction(self, action, scope, path, { throwUnknownError });
      });
    });
    return null;
  }
  return {
    executeAction,
    executeActions,
  };
};
