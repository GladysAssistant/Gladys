const { VARIABLES } = require('../../utils/constants');

/**
 * @description Create access and refresh tokens to allow SmartThings to be informed of device state
 * changes as they happen.
 * @param {string} accessToken - External cloud access token.
 * @param {Object} callbackAuthentication - ST access and refresh tokens for proactive state callbacks.
 * @param {Object} callbackUrls - Callback and refresh token URLs.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/smartthings-schema-reference.html#Reciprocal-Access-Token
 * @see https://github.com/SmartThingsCommunity/st-schema-nodejs
 *
 * @example
 * await smartthingsHandler.callbackAccessHandler(
 *  'smartthings-access-token',
 *  {
 *    callbackAuthentication:
 *    {
 *      grantType: "authorization_code",
 *      code: "xxxxxxxxxxx",
 *      clientId: "client id given to partner in dev-workspace during app creation",
 *      clientSecret: "client secret given to partner in dev-workspace during app creation",
 *    },
 *  },
 *  {
 *    callbackUrls:
 *    {
 *      oauthToken: "Callback URL for access-token-request.json and refresh-access-tokens.json requests",
 *      stateCallback: "Callback URL for state-callback.json updates",
 *    },
 *  });
 */
async function callbackAccessHandler(accessToken, callbackAuthentication, callbackUrls) {
  // Get current user
  const payload = this.gladys.session.validateAccessToken(accessToken);
  const userId = payload.user_id;

  // Stores callback information for current user
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

module.exports = {
  callbackAccessHandler,
};
