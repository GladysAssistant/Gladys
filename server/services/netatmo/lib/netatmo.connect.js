const crypto = require('crypto');
const { default: axios } = require('axios');
const querystring = require('querystring');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

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
    this.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }

  this.status = STATUS.CONNECTING;
  netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });

  logger.debug('Connecting to Netatmo...');

  this.stateGetAccessToken = crypto.randomBytes(16).toString('hex');
  const scopeValue = scopes && scopes.scopeEnergy ? scopes.scopeEnergy : SCOPES.ENERGY.read;
  this.redirectUri = `${this.baseUrl}/oauth2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopeValue)
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
 * await netatmo.retrieveTokens(netatmoHandler,
 *  {
 *    clientId, clientSecret, scopes
 *  },
 *  {
 *    codeOAuth, state, redirectUri
 *  },
 * );
 */
async function retrieveTokens(netatmoHandler, configuration, body) {
  const { clientId, clientSecret, scopes } = configuration;
  const { codeOAuth, state, redirectUri } = body;
  if (!clientId || !clientSecret || !scopes || !scopes.scopeEnergy || !codeOAuth) {
    netatmoHandler.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }

  netatmoHandler.status = STATUS.PROCESSING_TOKEN;
  netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });

  if (state !== netatmoHandler.stateGetAccessToken) {
    this.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError(
      'Netatmo did not connect correctly. The return does not correspond to the initial request',
    );
  }

  logger.debug('Loading Netatmo access tokens...');

  const scopeValue = scopes && scopes.scopeEnergy ? scopes.scopeEnergy : SCOPES.ENERGY.read;
  const authentificationForm = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    scope: scopeValue,
    code: body.codeOAuth,
  };

  let accessToken;
  let refreshToken;
  try {
    const response = await axios({
      url: `${this.baseUrl}/oauth2/token`,
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Host: 'api.netatmo.com' },
      data: querystring.stringify(authentificationForm),
    });

    console.log('response', response)
    const tokens = {
      ...response.data,
      connected: true,
    };
    await netatmoHandler.setTokens(tokens);
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    this.configured = true;
    this.status = STATUS.CONNECTED;
    logger.debug('Netatmo new access tokens well loaded');
  } catch (e) {
    this.status = STATUS.ERROR;
    logger.error('Error getting new accessToken to Netatmo - Details:', e.response ? e.response.data : e);
    throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
  }

  netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });

  if (accessToken && refreshToken) {
    return { success: true };
  }
  return { success: false };
}

module.exports = {
  connect,
  retrieveTokens,
};
