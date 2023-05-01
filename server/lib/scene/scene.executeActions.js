const Promise = require('bluebird');
const { actionsFunc } = require('./scene.actions');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { AbortScene } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Execute one action.
 * @param {object} self - Reference to the SceneManager.
 * @param {object} action - An Action from the db.
 * @param {object} scope - The scope passed to all actions.
 * @param {number} [columnIndex] - The X index of the action in the array of actions.
 * @param {number} [rowIndex] - The Y index of the action in the array of actions.
 * @returns {Promise} Resolve if the action was executed with success.
 * @example
 * executeAction(this, action, {});
 */
async function executeAction(self, action, scope, columnIndex, rowIndex) {
  if (!actionsFunc[action.type]) {
    throw new Error(`Action type "${action.type}" does not exist.`);
  }

  // send message to tell UI the action is executed
  if (columnIndex !== undefined && rowIndex !== undefined) {
    self.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SCENE.EXECUTING_ACTION,
      payload: { columnIndex, rowIndex },
    });
  }
  try {
    // execute action
    await actionsFunc[action.type](self, action, scope, columnIndex, rowIndex);
  } catch (e) {
    if (e instanceof AbortScene) {
      throw e;
    } else {
      logger.warn(e);
    }
  }

  // send message to tell the UI the action has finished being executed
  if (columnIndex !== undefined && rowIndex !== undefined) {
    self.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SCENE.FINISHED_EXECUTING_ACTION,
      payload: { columnIndex, rowIndex },
    });
  }

  return null;
}

/**
 * @description Execute an array of array of action.
 * @param {object} self - Reference to the SceneManager.
 * @param {object} actions - An array of array of actions from the db.
 * @param {object} scope - The scope passed to all actions.
 * @returns {Promise} Resolve if the action was executed with success.
 * @example
 * executeActions(this, actions, {});
 */
async function executeActions(self, actions, scope) {
  // first array level should be executed in serie
  await Promise.mapSeries(actions, async (parallelActions, columnIndex) => {
    // then, second level is executed in parallel
    await Promise.map(parallelActions, async (action, rowIndex) => {
      await executeAction(self, action, scope, columnIndex, rowIndex);
    });
  });
  return null;
}

module.exports = {
  executeAction,
  executeActions,
};
