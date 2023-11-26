const { default: axios } = require('axios');
const querystring = require('querystring');
const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

const { STATUS, SCOPES } = require('./utils/netatmo.constants');

/**
 * @description Implements Netatmo connector get access token method.
 * @param {object} configuration - Netatmo configuration properties.
 * @returns {Promise} Netatmo access token.
 * @example
 * await netatmo.getAccessToken({baseUrl, username, clientId, clientSecret, accessToken, refreshToken, scopes});
 */
async function getAccessToken(netatmoHandler, configuration, req) {
  const { baseUrl, clientId, clientSecret, access_token, scopes } = configuration;

  if (!baseUrl || !clientId || !clientSecret || (!req.codeOAuth && !access_token)) {
    netatmoHandler.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }

  netatmoHandler.status = STATUS.PROCESSING_TOKEN;
  netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });

  if (req.state !== netatmoHandler.state) {
    this.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('Netatmo is not configured. The return does not correspond to the initial request');
  }

  logger.debug('Loading Netatmo access token...');
  
  const scopeValue = scopes && scopes.scopeEnergy ? scopes.scopeEnergy : SCOPES.ENERGY.read;
  const authentificationForm = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: req.redirectUri,
    scope: scopeValue,
    code: req.codeOAuth,
  };

  logger.error(authentificationForm);
  logger.error(querystring.stringify(authentificationForm));
  let accessToken;
  let refreshToken;
  try {
    const response = await axios({
      url: `${baseUrl}/oauth2/token`,
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'Host': 'api.netatmo.com' },
      data: querystring.stringify(authentificationForm),
    });
    logger.error(response.data);
    const tokens = {
      ...response.data.tokens,
      connected: true
    }
    await netatmoHandler.setTokens(tokens);
    accessToken = response.data.accessToken
    refreshToken = response.data.accessToken
    this.status = STATUS.CONNECTED;
    logger.debug('Netatmo access token well loaded');
  } catch (e) {
    this.status = STATUS.ERROR;
    logger.error('Error obtention access_token to Netatmo - Details:', e.response ? e.response.data : e);
    logger.info('scopeValue:', scopeValue);
    logger.error('scopes:', scopes);
    throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
  }

  netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });

  return { accessToken, refreshToken };
}

module.exports = {
  getAccessToken,
};
