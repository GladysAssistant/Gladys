const logger = require('../../utils/logger');
const executeActionsFactory = require('./scene.executeActions');
const actionsFunc = require('./scene.actions');

const { executeAction } = executeActionsFactory(actionsFunc);

/**
 * @description Execute an action coming from an event.
 * @param {object} action - The action to execute.
 * @param {object} scope - The scope of the action.
 * @example
 * scene.executeSingleAction({
 *    type: 'light.turn-on',
 *    device: 'light',
 * });
 */
async function executeSingleAction(action, scope = {}) {
  logger.debug(`Executing action of type ${action.type}`);
  try {
    // Default path is "1.1"
    await executeAction(this, action, scope, '1.1');
  } catch (e) {
    logger.warn(`There was an error executing action ${action.type}`);
    logger.warn(e);
  }
}

module.exports = {
  executeSingleAction,
};
