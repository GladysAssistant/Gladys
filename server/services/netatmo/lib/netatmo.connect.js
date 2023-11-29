const crypto = require('crypto');
const { default: axios } = require('axios');
const querystring = require('querystring');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, SCOPES } = require('./utils/netatmo.constants');

/**
 * @description Connect to Netatmo and getting code to get access tokens.
 * @param {object} netatmoHandler - Netatmo handler.
 * @param {object} configuration - Netatmo configuration properties.
 * @returns {Promise} Netatmo access token.
 * @example
 * connect(netatmoHandler, {clientId, clientSecret, scope});
 */
async function connect(netatmoHandler, configuration) {
  const { clientId, clientSecret, scopes } = configuration;

  if (!clientId || !clientSecret || !scopes) {
    await netatmoHandler.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null })
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  await netatmoHandler.saveStatus({ statusType: STATUS.CONNECTING, message: null })
  logger.debug('Connecting to Netatmo...');

  this.stateGetAccessToken = crypto.randomBytes(16).toString('hex');
  const scopeValue = scopes && scopes.scopeEnergy ? scopes.scopeEnergy : SCOPES.ENERGY.read;
  this.redirectUri = `${netatmoHandler.baseUrl}/oauth2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopeValue)
    }&state=${this.stateGetAccessToken}`;
  this.configured = true;
  return { authUrl: this.redirectUri, state: this.stateGetAccessToken };
}

/**
 * @description Netatmo retrieve access and refresh token method.
 * @param {object} netatmoHandler - Netatmo handler.
 * @param {object} configuration - Netatmo configuration properties.
 * @param {object} body - Netatmo code to retrieve access tokens.
 * @returns {Promise<object>} Netatmo access token.
 * @example
 * await netatmo.retrieveTokens(
 *  netatmoHandler,
 *  {clientId, clientSecret, scopes},
 *  {codeOAuth, state, redirectUri},
 * );
 */
async function retrieveTokens(netatmoHandler, configuration, body) {
  const { clientId, clientSecret, scopes } = configuration;
  const { codeOAuth, state, redirectUri } = body;
  if (!clientId || !clientSecret || !scopes || !codeOAuth) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null })
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  if (state !== netatmoHandler.stateGetAccessToken) {
    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null })
    throw new ServiceNotConfiguredError(
      'Netatmo did not connect correctly. The return does not correspond to the initial request',
    );
  }
  await this.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null })
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
      url: `${this.baseUrl}/oauth2/token`,
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Host: 'api.netatmo.com' },
      data: querystring.stringify(authentificationForm),
    });
    const tokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expire_in: response.data.expire_in,
      connected: true,
    };
    await netatmoHandler.setTokens(tokens);
    await this.saveStatus({ statusType: STATUS.CONNECTED })
    logger.debug('Netatmo new access tokens well loaded');
    return { success: true };
  } catch (e) {
    this.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: 'get_access_token_fail' })
    logger.error('Error getting new accessToken to Netatmo - Details:', e.response ? e.response.data : e);
    throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
  }
}

module.exports = {
  connect,
  retrieveTokens,
};
