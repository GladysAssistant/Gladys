const get = require('get-value');

const GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY = 'GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY';

/**
 * @description Handle a new Gladys Google Home Gateway message.
 * @param {Object} data - Gateway message.
 * @param {Object} rawMessage - Message with metadata.
 * @param {Function} cb - Callback.
 * @returns {Promise} Resolve when finished.
 * @example
 * handleNewMessage({
 *  type: 'gladys-api-call',
 * });
 */
async function handleGoogleHomeMessage(data, rawMessage, cb) {
  const service = this.serviceManager.getService('google-actions');
  const body = {
    ...data.data,
    user: {
      id: rawMessage.sender_id,
      local_user_id: rawMessage.local_user_id,
    },
  };
  // save that the user is connected to gateway google home
  if (!this.usersConnectedGoogleHomeGateway.has(rawMessage.local_user_id)) {
    await this.variable.setValue(
      GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY,
      rawMessage.sender_id,
      null,
      rawMessage.local_user_id,
    );
    this.usersConnectedGoogleHomeGateway.add(rawMessage.local_user_id);
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
    await this.variable.destroy(GOOGLE_HOME_USER_IS_CONNECTED_WITH_GATEWAY, null, rawMessage.local_user_id);
    this.usersConnectedGoogleHomeGateway.delete(rawMessage.local_user_id);
    response = {};
  } else {
    response = {
      status: 400,
    };
  }

  cb(response);
}

module.exports = {
  handleGoogleHomeMessage,
};
