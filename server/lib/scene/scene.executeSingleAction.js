const get = require('get-value');

const logger = require('../../utils/logger');
const executeActionsFactory = require('./scene.executeActions');
const actionsFunc = require('./scene.actions');
const { ACTIONS, EVENTS, WEBSOCKET_MESSAGE_TYPES, DEVICE_SET_VALUE_ERROR_CAUSES } = require('../../utils/constants');
const { getDeviceFeature } = require('../../utils/device');
const { NotFoundError, ServiceNotConfiguredError, BadParameters, AbortScene } = require('../../utils/coreErrors');

const { executeAction } = executeActionsFactory(actionsFunc);

/**
 * @description Why a value could not be set, as one of DEVICE_SET_VALUE_ERROR_CAUSES: the
 * message of the error stays in the logs (it can be third-party text, or name a host).
 * @param {Error} error - The error of the action.
 * @param {object} deviceFeature - The feature the value was for, null when it does not exist.
 * @returns {string} The cause.
 * @example
 * getSetValueErrorCause(new ServiceNotConfiguredError(), deviceFeature);
 */
function getSetValueErrorCause(error, deviceFeature) {
  if (deviceFeature === null || error instanceof NotFoundError) {
    return DEVICE_SET_VALUE_ERROR_CAUSES.NOT_FOUND;
  }
  if (error instanceof ServiceNotConfiguredError) {
    return DEVICE_SET_VALUE_ERROR_CAUSES.NOT_CONFIGURED;
  }
  if (error instanceof BadParameters || error instanceof AbortScene) {
    return DEVICE_SET_VALUE_ERROR_CAUSES.REFUSED;
  }
  return DEVICE_SET_VALUE_ERROR_CAUSES.UNREACHABLE;
}

/**
 * @description Tell the user who asked for a device value that it could not be set. The
 * answer to their request left before the action ran, so this message is the only way their
 * screens can stop showing the value they asked for: it carries the state Gladys really holds.
 * It goes to every screen of that user; `client_id` names the one which sent the command.
 * @param {object} self - The scene manager.
 * @param {object} action - The action which failed.
 * @param {Error} error - Why it failed.
 * @example
 * notifySetValueError(this, { type: 'device.set-value', device_feature: 'lamp', user_id: '...' }, error);
 */
function notifySetValueError(self, action, error) {
  let device = null;
  let deviceFeature = null;
  if (action.device_feature) {
    deviceFeature = self.stateManager.get('deviceFeature', action.device_feature);
    device = deviceFeature ? self.stateManager.get('deviceById', deviceFeature.device_id) : null;
  } else {
    device = self.stateManager.get('device', action.device);
    deviceFeature = getDeviceFeature(device, action.feature_category, action.feature_type);
  }
  self.event.emit(EVENTS.WEBSOCKET.SEND, {
    type: WEBSOCKET_MESSAGE_TYPES.DEVICE.SET_VALUE_ERROR,
    userId: action.user_id,
    payload: {
      client_id: action.client_id || null,
      cause: getSetValueErrorCause(error, deviceFeature),
      device_feature_selector: deviceFeature ? deviceFeature.selector : action.device_feature || null,
      device_feature_name: deviceFeature ? deviceFeature.name : null,
      device_selector: device ? device.selector : action.device || null,
      device_name: device ? device.name : null,
      value: action.value,
      // the state to go back to (null when the device or the feature does not exist)
      last_value: deviceFeature ? deviceFeature.last_value : null,
      last_value_string: deviceFeature ? deviceFeature.last_value_string : null,
      last_value_changed: deviceFeature ? deviceFeature.last_value_changed : null,
    },
  });
}

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
    // Default path is "1.1". The error of the action is wanted here: it is logged below, and
    // reported to the user who asked for the value.
    await executeAction(this, action, scope, '1.1', { throwUnknownError: true });
  } catch (e) {
    logger.warn(`There was an error executing action ${action.type}`);
    logger.warn(e);
    // Only a value asked by a user (dashboard, device page...) is reported: the other
    // sources of actions (voice assistants, HomeKit...) have no screen waiting for it.
    // And only when the device was not driven: an error raised once it was (its new state
    // could not be recorded, see device.setValue) is not a command which failed.
    if (action.type === ACTIONS.DEVICE.SET_VALUE && action.user_id && !get(e, 'deviceDriven')) {
      notifySetValueError(this, action, e);
    }
  }
}

module.exports = {
  executeSingleAction,
};
