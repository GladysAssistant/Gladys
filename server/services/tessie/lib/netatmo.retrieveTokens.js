const { fetch } = require('undici');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API } = require('./utils/tessie.constants');

/**
 * @description Tessie retrieve access and refresh token method.
 * @param {object} body - Tessie code to retrieve access tokens.
 * @returns {Promise<object>} Tessie access token.
 * @example
 * await tessie.retrieveTokens(
 *  {codeOAuth, state, redirectUri},
 * );
 */
async function retrieveTokens(body) {
  logger.debug('Getting tokens to Tessie API...');
  const { clientId, clientSecret, scopes } = this.configuration;
  const { codeOAuth, state, redirectUri } = body;
  if (!clientId || !clientSecret || !codeOAuth) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not configured.');
  }
  if (state !== this.stateGetAccessToken) {
    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
    throw new ServiceNotConfiguredError(
      'Tessie did not connect correctly. The return does not correspond to the initial request',
    );
  }
  await this.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null });
  const scopeValues = Object.values(scopes).join(' ');
  const authentificationForm = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    scope: scopeValues,
    code: body.codeOAuth,
  };
  try {
    const response = await fetch(API.TOKEN, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Host: API.HEADER.HOST,
      },
      body: new URLSearchParams(authentificationForm).toString(),
    });
    const rawBody = await response.text();
    if (!response.ok) {
      logger.error('Error getting new accessToken to Tessie - Details: ', response.status, rawBody);
      throw new Error(`HTTP error ${response.status} - ${rawBody}`);
    }
    const data = JSON.parse(rawBody);
    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expireIn: data.expire_in,
    };
    await this.setTokens(tokens);
    this.accessToken = tokens.accessToken;
    await this.saveStatus({ statusType: STATUS.CONNECTED });
    logger.debug('Tessie new access tokens well loaded');
    if (this.configuration.energyApi || this.configuration.weatherApi) {
      await this.pollRefreshingValues();
    }
    await this.pollRefreshingToken();
    return { success: true };
  } catch (e) {
    this.saveStatus({
      statusType: STATUS.ERROR.PROCESSING_TOKEN,
      message: 'get_access_token_fail',
    });
    logger.error('Error getting new accessToken to Tessie - Details: ', e);
    throw new ServiceNotConfiguredError(`TESSIE: Service is not connected with error ${e}`);
  }
}

module.exports = {
  retrieveTokens,
};
