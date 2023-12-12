const { default: axios } = require('axios');
const querystring = require('querystring');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API } = require('./utils/netatmo.constants');

/**
 * @description Netatmo retrieve access and refresh token method.
 * @returns {Promise} Netatmo access token success.
 * @example
 * await netatmo.refreshingTokens();
 */
async function refreshingTokens() {
  const { clientId, clientSecret } = this.configuration;
  if (!clientId || !clientSecret || !this.refreshToken) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not connected.');
  }
  await this.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null });
  logger.debug('Loading Netatmo refreshing tokens...');
  const authentificationForm = {
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: this.refreshToken,
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
      // connected: true,
    };
    await this.setTokens(this, tokens);
    await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    logger.debug('Netatmo new access tokens well loaded with status: ', this.status);
    return { success: true };
  } catch (e) {
    this.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: 'refresh_token_fail' });
    logger.error('Error getting new accessToken to Netatmo - Details:', e.response ? e.response.data : e);
    throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
  }
}

module.exports = {
  refreshingTokens,
};
