const { AuthorizationCode } = require('simple-oauth2');
const { OAUTH2 } = require('../../utils/constants');

/**
 * @description Build a authorization uri of current oauth2 integration.
 * @param {string} serviceId - Gladys serviceId of current integration.
 * @param {string} userId - Gladys userId of current session.
 * @param {string} integrationName - Current integration name.
 * @param {string} referer - Gladys referer.
 * @returns {Promise} Resolve with current integration service id.
 * @example
 * oauth2.buildAuthorizationUri(
 *  userId: fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  serviceId: 'ffsdvs687f0bf3414e0fe3facfba7be945510fds09a'
 *  integrationName: 'integrationName',
 *  referer: 'http://localhost:1444/'
 *  }
 * );
 */
async function buildAuthorizationUri(serviceId, userId, integrationName, referer) {
  // Find provider configuration
  const tokenHost = await this.variable.getValue(OAUTH2.VARIABLE.TOKEN_HOST, serviceId);
  const authorizeHost = await this.variable.getValue(OAUTH2.VARIABLE.AUTHORIZE_HOST, serviceId);
  const authorizePath = await this.variable.getValue(OAUTH2.VARIABLE.AUTHORIZE_PATH, serviceId);
  const integrationScope = await this.variable.getValue(OAUTH2.VARIABLE.INTEGRATION_SCOPE, serviceId);
  const redirectUriSuffix = await this.variable.getValue(OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX, serviceId);

  // Get variale client id and client secret
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
      authorizeHost,
      authorizePath,
    },
  };

  const client = new AuthorizationCode(credentials);
  const authorizationUriResult = await client.authorizeURL({
    redirect_uri: `${referer}${redirectUriSuffix}`,
    scope: integrationScope,
    state: `gladys_state_${integrationName}`,
  });

  return authorizationUriResult;
}

module.exports = {
  buildAuthorizationUri,
};
