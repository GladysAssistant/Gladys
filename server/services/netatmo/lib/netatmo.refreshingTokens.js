const { fetch } = require('undici');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API, FATAL_RETRY_WINDOW_MS } = require('./utils/netatmo.constants');

const isTransientHttpStatus = (status) => status >= 500 || status === 429;

/**
 * @description Netatmo retrieve access and refresh token method.
 * @returns {Promise} Netatmo access token success.
 * @example
 * await netatmo.refreshingTokens();
 */
async function refreshingTokens() {
  const { clientId, clientSecret } = this.configuration;
  if (!clientId || !clientSecret) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  if (!this.accessToken || !this.refreshToken) {
    logger.debug('Netatmo no access or no refresh token');
    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
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
  let response;
  let rawBody;
  try {
    response = await fetch(API.TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Host: API.HEADER.HOST,
      },
      body: new URLSearchParams(authentificationForm).toString(),
    });
    rawBody = await response.text();
  } catch (e) {
    logger.warn('Netatmo refresh token transient network error, keeping tokens for retry: ', e);
    await this.saveStatus({ statusType: STATUS.RECONNECTING, message: 'refresh_token_transient' });
    const transientError = new Error(`NETATMO: Transient network error during token refresh - ${e.message}`);
    transientError.transient = true;
    throw transientError;
  }

  if (!response.ok) {
    if (isTransientHttpStatus(response.status)) {
      logger.warn(
        `Netatmo refresh token transient HTTP error ${response.status}, keeping tokens for retry: ${rawBody}`,
      );
      await this.saveStatus({ statusType: STATUS.RECONNECTING, message: 'refresh_token_transient' });
      const transientError = new Error(`NETATMO: Transient HTTP ${response.status} during token refresh - ${rawBody}`);
      transientError.transient = true;
      transientError.status = response.status;
      throw transientError;
    }
    const now = Date.now();
    if (!this.firstFatalAt) {
      this.firstFatalAt = now;
    }
    const withinRetryWindow = now - this.firstFatalAt < FATAL_RETRY_WINDOW_MS;
    if (withinRetryWindow) {
      logger.warn(
        `Netatmo refresh token fatal error ${response.status}, keeping tokens within ${FATAL_RETRY_WINDOW_MS}ms grace window: ${rawBody}`,
      );
      await this.saveStatus({ statusType: STATUS.RECONNECTING, message: 'refresh_token_fatal_grace' });
      const gracefulError = new Error(`NETATMO: Fatal HTTP ${response.status} during token refresh - ${rawBody}`);
      gracefulError.transient = true;
      gracefulError.status = response.status;
      throw gracefulError;
    }
    logger.error('Netatmo refresh token fatal error past grace window, clearing tokens: ', response.status, rawBody);
    await this.setTokens({ accessToken: '', refreshToken: '', expireIn: '' });
    await this.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: 'refresh_token_fail' });
    this.firstFatalAt = null;
    throw new Error(`HTTP error ${response.status} - ${rawBody}`);
  }

  try {
    const data = JSON.parse(rawBody);
    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expireIn: data.expire_in,
    };
    await this.setTokens(tokens);
    this.firstFatalAt = null;
    await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    logger.debug('Netatmo new access tokens well loaded with status: ', this.status);
    return { success: true };
  } catch (e) {
    logger.error('Netatmo refresh token response parsing failed, clearing tokens: ', e);
    await this.setTokens({ accessToken: '', refreshToken: '', expireIn: '' });
    await this.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: 'refresh_token_fail' });
    throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
  }
}

module.exports = {
  refreshingTokens,
};
