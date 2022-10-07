const { AuthorizationCode } = require('simple-oauth2');
const { OAUTH2 } = require('./utils/constants.js');

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
      tokenHost: this.tokenHost,
      authorizeHost: this.authorizeHost,
      authorizePath: this.authorizePath,
    },
  };

  const client = new AuthorizationCode(credentials);
  const authorizationUriResult = await client.authorizeURL({
    redirect_uri: this.buildRedirectUri(referer, this.redirectUriSuffix),
    scope: this.integrationScope,
    state: `gladys_state_${integrationName}`,
  });

  return authorizationUriResult;
}

module.exports = {
  buildAuthorizationUri,
};
