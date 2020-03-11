const logger = require('../../utils/logger');
const { executeAction } = require('./scene.executeActions');

/**
 * @description Execute an action coming from an event.
 * @param {Object} action - The action to execute.
 * @param {Object} scope - The scope of the action.
 * @example
 * scene.executeSingleAction({
 *    type: 'light.turn-on',
 *    device: 'light',
 * });
 */
async function executeSingleAction(action, scope = {}) {
  logger.debug(`Executing action of type ${action.type}`);
  try {
    await executeAction(this, action, scope);
  } catch (e) {
    throw new Error(`There was an error executing action ${action.type}`);
  }
}

module.exports = {
  executeSingleAction,
};
