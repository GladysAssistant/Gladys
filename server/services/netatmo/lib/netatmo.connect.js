const crypto = require('crypto');
const { default: axios } = require('axios');
const querystring = require('querystring');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, SCOPES, API } = require('./utils/netatmo.constants');

/**
 * @description Connect to Netatmo and getting code to get access tokens.
 * @param {object} netatmoHandler - Netatmo handler.
 * @returns {Promise} Netatmo access token.
 * @example
 * connect(netatmoHandler);
 */
async function connect(netatmoHandler) {
  const { clientId, clientSecret, scopes } = netatmoHandler.configuration;

  if (!clientId || !clientSecret || !scopes) {
    await netatmoHandler.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  await netatmoHandler.saveStatus({ statusType: STATUS.CONNECTING, message: null });
  logger.debug('Connecting to Netatmo...');

  netatmoHandler.stateGetAccessToken = crypto.randomBytes(16).toString('hex');
  const scopeValue = scopes && scopes.scopeEnergy ? scopes.scopeEnergy : SCOPES.ENERGY.read;
  netatmoHandler.redirectUri = `${API.OAUTH2}?client_id=${clientId}&scope=${encodeURIComponent(scopeValue)}&state=${
    netatmoHandler.stateGetAccessToken
  }`;
  netatmoHandler.configured = true;
  return { authUrl: netatmoHandler.redirectUri, state: netatmoHandler.stateGetAccessToken };
}

/**
 * @description Netatmo retrieve access and refresh token method.
 * @param {object} netatmoHandler - Netatmo handler.
 * @param {object} body - Netatmo code to retrieve access tokens.
 * @returns {Promise<object>} Netatmo access token.
 * @example
 * await netatmo.retrieveTokens(
 *  netatmoHandler,
 *  {codeOAuth, state, redirectUri},
 * );
 */
async function retrieveTokens(netatmoHandler, body) {
  const { clientId, clientSecret, scopes } = netatmoHandler.configuration;
  const { codeOAuth, state, redirectUri } = body;
  if (!clientId || !clientSecret || !scopes || !codeOAuth) {
    await netatmoHandler.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  if (state !== netatmoHandler.stateGetAccessToken) {
    await netatmoHandler.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
    throw new ServiceNotConfiguredError(
      'Netatmo did not connect correctly. The return does not correspond to the initial request',
    );
  }
  await netatmoHandler.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null });
  const scopeValue = scopes && scopes.scopeEnergy ? scopes.scopeEnergy : SCOPES.ENERGY.read;
  const authentificationForm = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    scope: scopeValue,
    code: body.codeOAuth,
  };
  try {
    const response = await axios({
      url: `${API.TOKEN}`,
      method: 'post',
      headers: { 'Content-Type': API.HEADER.CONTENT_TYPE, Host: API.HEADER.HOST },
      data: querystring.stringify(authentificationForm),
    });
    const tokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expireIn: response.data.expire_in,
      connected: true,
    };
    await netatmoHandler.setTokens(netatmoHandler, tokens);
    netatmoHandler.accessToken = tokens.accessToken;
    await netatmoHandler.saveStatus({ statusType: STATUS.CONNECTED });
    logger.debug('Netatmo new access tokens well loaded');
    await netatmoHandler.pollRefreshingToken(netatmoHandler);
    await netatmoHandler.pollRefreshingValues(netatmoHandler);
    return { success: true };
  } catch (e) {
    netatmoHandler.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: 'get_access_token_fail' });
    logger.error('Error getting new accessToken to Netatmo - Details:', e.response ? e.response.data : e);
    throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
  }
}

module.exports = {
  connect,
  retrieveTokens,
};
