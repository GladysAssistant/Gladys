const { fetch } = require('undici');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API } = require('./utils/tessie.constants');

/**
 * @description Tessie retrieve access and refresh token method.
 * @returns {Promise} Tessie access token success.
 * @example
 * await tessie.refreshingTokens();
 */
async function refreshingTokens() {
  const { clientId, clientSecret } = this.configuration;
  if (!clientId || !clientSecret) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not configured.');
  }
  if (!this.accessToken || !this.refreshToken) {
    logger.debug('Tessie no access or no refresh token');
    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not connected.');
  }
  await this.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null });
  logger.debug('Loading Tessie refreshing tokens...');
  const authentificationForm = {
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: this.refreshToken,
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
      logger.error('Error getting new refresh token: ', response.status, rawBody);
      throw new Error(`HTTP error ${response.status} - ${rawBody}`);
    }
    const data = JSON.parse(rawBody);
    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expireIn: data.expire_in,
    };
    await this.setTokens(tokens);
    await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    logger.debug('Tessie new access tokens well loaded with status: ', this.status);
    return { success: true };
  } catch (e) {
    logger.error('Tessie no successfull refresh token and disconnect: ', e);
    const tokens = {
      accessToken: '',
      refreshToken: '',
      expireIn: '',
    };
    await this.setTokens(tokens);
    await this.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: 'refresh_token_fail' });
    throw new ServiceNotConfiguredError(`TESSIE: Service is not connected with error ${e}`);
  }
}

module.exports = {
  refreshingTokens,
};
