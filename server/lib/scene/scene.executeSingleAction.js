const logger = require('../../utils/logger');
const { executeAction } = require('./scene.executeActions');

/**
 * @description Execute an action coming from an event.
 * @param {Object} action - The action to execute.
 * @example
 * scene.executeSingleAction({
 *    type: 'light.turn-on',
 *    device: 'light',
 * });
 */
async function executeSingleAction(action) {
  logger.debug(`Executing action of type ${action.type}`);
  try {
    await executeAction(this, action, action.scope);
  } catch (e) {
    logger.warn(`There was an error executing action ${action.type}`);
    logger.warn(e);
  }
}

module.exports = {
  executeSingleAction,
};
