const { AuthorizationCode } = require('simple-oauth2');
const logger = require('../../utils/logger');
const { OAUTH2 } = require('../../utils/constants');
const { BadOauth2ClientResponse } = require('../../utils/coreErrors');

/**
 * @description Get new  AccessToken with client_id and secrei_id of current oauth2 integration.
 * @param {string} serviceId - This serviceId of current integration.
 * @param {string} userId - This userId of current session.
 * @param {string} authorizationCode - Authorization code for nex token.
 * @param {string} referer - Gladys referer.
 * @returns {Promise} Resolve with current integration service id.
 * @example
 * oauth2.getAccessToken(
 *  userId: fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  serviceId: 'ffsdvs687f0bf3414e0fe3facfba7be945510fds09a'
 *  authorizationCode:  '25dbf26a066d947fca82a1f05ae5890f79a27687',
 *  referer: 'http://localhost:1444/'
 *  }
 * );
 */
async function getAccessToken(serviceId, userId, authorizationCode, referer) {
  // Find provider configuration
  const tokenHost = await this.variable.getValue(OAUTH2.VARIABLE.TOKEN_HOST, serviceId);
  const tokenPath = await this.variable.getValue(OAUTH2.VARIABLE.TOKEN_PATH, serviceId);
  const authorizeHost = await this.variable.getValue(OAUTH2.VARIABLE.AUTHORIZE_HOST, serviceId);
  const authorizePath = await this.variable.getValue(OAUTH2.VARIABLE.AUTHORIZE_PATH, serviceId);
  const grantType = await this.variable.getValue(OAUTH2.VARIABLE.GRANT_TYPE, serviceId);
  const additionalAccessTokenRequestAxtionParam = await this.variable.getValue(
    OAUTH2.VARIABLE.ADDITIONAL_ACCESS_TOKEN_REQUEST_ACTION_PARAM,
    serviceId,
  );
  const redirectUriSuffix = await this.variable.getValue(OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX, serviceId);

  const clientId = await this.variable.getValue(OAUTH2.VARIABLE.CLIENT_ID, serviceId, userId);
  const secret = await this.variable.getValue(OAUTH2.VARIABLE.CLIENT_SECRET, serviceId, userId);

  // Init credentials based on integration name
  const credentials = {
    client: {
      id: clientId,
      secret,
    },
    auth: {
      tokenHost,
      tokenPath,
      authorizeHost,
      authorizePath,
    },
  };

  // Build token access request
  const tokenConfig = {
    code: authorizationCode,
    client_id: clientId,
    client_secret: secret,
    grant_type: grantType,
    redirect_uri: `${referer}${redirectUriSuffix}`,
  };
  if (additionalAccessTokenRequestAxtionParam) {
    tokenConfig.action = additionalAccessTokenRequestAxtionParam;
  }

  try {
    const client = new AuthorizationCode(credentials);
    const authResult = await client.getToken(tokenConfig, { json: true });

    if (authResult.token) {
      if (authResult.token.status && authResult.token.status !== 0) {
        throw new BadOauth2ClientResponse('Oauth2 get token response is not with status 0');
      }

      let jsonResult;
      if (authResult.token.body) {
        jsonResult = authResult.token.body;
      } else {
        jsonResult = authResult.token;
      }
      if (!jsonResult.expires_at && jsonResult.expires_in) {
        const expiredAt = new Date();
        expiredAt.setSeconds(expiredAt.getSeconds() + jsonResult.expires_in);
        jsonResult.expires_at = expiredAt.toISOString();
      }

      // Save accessToken
      await this.variable.setValue(OAUTH2.VARIABLE.ACCESS_TOKEN, JSON.stringify(jsonResult), serviceId, userId);
    }

    return authResult;
  } catch (error) {
    await this.variable.destroy(OAUTH2.VARIABLE.CLIENT_ID, serviceId, userId);
    await this.variable.destroy(OAUTH2.VARIABLE.CLIENT_SECRET, serviceId, userId);
    logger.error(error);
    throw error;
  }
}

module.exports = {
  getAccessToken,
};
