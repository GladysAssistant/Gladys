const get = require('get-value');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Handle a new Gladys Google Home Gateway message.
 * @param {object} data - Gateway message.
 * @param {object} rawMessage - Message with metadata.
 * @param {Function} cb - Callback.
 * @returns {Promise} Resolve when finished.
 * @example
 * handleNewMessage({
 *  type: 'gladys-api-call',
 * });
 */
async function handleGoogleHomeMessage(data, rawMessage, cb) {
  const service = this.serviceManager.getService('google-actions');
  try {
    const body = {
      ...data.data,
      user: {
        id: rawMessage.sender_id,
        local_user_id: rawMessage.local_user_id,
      },
    };
    // save that the user is connected to gateway google home
    if (!this.googleHomeConnected) {
      await this.variable.setValue(
        SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY,
        rawMessage.sender_id,
      );
      this.googleHomeConnected = true;
    }
    const firstOrderIntent = get(body, 'inputs.0.intent');
    let response;
    if (firstOrderIntent === 'action.devices.SYNC') {
      response = await service.googleActionsHandler.onSync(body);
    } else if (firstOrderIntent === 'action.devices.QUERY') {
      response = await service.googleActionsHandler.onQuery(body);
    } else if (firstOrderIntent === 'action.devices.EXECUTE') {
      response = await service.googleActionsHandler.onExecute(body);
    } else if (firstOrderIntent === 'action.devices.DISCONNECT') {
      await this.variable.destroy(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY);
      this.googleHomeConnected = false;
      response = {};
    } else {
      response = {
        status: 400,
      };
    }

    cb(response);
  } catch (e) {
    logger.error(e);
    cb({ status: 400 });
  }
}

module.exports = {
  handleGoogleHomeMessage,
};
