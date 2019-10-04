const logger = require('../../../../utils/logger');
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
  await this.gladys.variable.setValue(VARIABLES.SMT_TOKEN_CALLBACK_URL, callbackUrls.oauthToken, this.serviceId);
  await this.gladys.variable.setValue(VARIABLES.SMT_STATE_CALLBACK_URL, callbackUrls.stateCallback, this.serviceId);

  // TODO manage OAuth
  logger.trace(`SmartThings connector: "callbackAccessHandler" not completly implemented : ${accessToken}`);
}

module.exports = {
  callbackAccessHandler,
};
