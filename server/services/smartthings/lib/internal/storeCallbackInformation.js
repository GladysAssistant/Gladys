const { VARIABLES } = require('../../utils/constants');

/**
 * @description Stores callback information for the user.
 * @param {*} callbackAuthentication - Received callback information.
 * @param {*} callbackUrls - Received callback URLs.
 * @param {*} userId - Current user.
 * @example
 * smartthings.storeCallbackInformation({}, {}, 'a810b8db-6d04-4697-bed3-c4b72c996279');
 */
async function storeCallbackInformation(callbackAuthentication, callbackUrls, userId) {
  const callBackInfo = {
    callbackAuthentication,
    callbackUrls,
  };

  await this.gladys.variable.setValue(
    VARIABLES.SMT_CALLBACK_OAUTH,
    JSON.stringify(callBackInfo),
    this.serviceId,
    userId,
  );

  this.callbackUsers[userId] = callBackInfo;
}

module.exports = { storeCallbackInformation };
