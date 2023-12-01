const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { NB_MAX_RETRY_EXPIRED } = require('../utils/constants');

/**
 * @description Provides a single way to manage WS requests with retries and refresh token.
 * @param {Function} request - Client request.
 * @param {number} nbRetry - Number of retry.
 * @returns {Promise} The WS call response.
 * @example
 * const data = await this.handleRequest(() => client.getDevices());
 */
async function handleRequest(request, nbRetry = 0) {
  // Do not call API if service is not ready
  const { configured, connected } = this.status;
  if (!configured || !connected) {
    throw new ServiceNotConfiguredError('eWeLink is not ready, please complete the configuration');
  }

  const response = await request();

  // 402 - Access token expired, so refresh it and retry.
  // see https://coolkit-technologies.github.io/eWeLink-API/#/en/APICenterV2?id=error-codes
  if (response.error === 402 && nbRetry < NB_MAX_RETRY_EXPIRED) {
    const tokenResponse = await this.ewelinkClient.user.refreshToken();
    const tokens = await this.handleResponse(tokenResponse);
    // Store new tokens
    await this.saveTokens(tokens);
    // Retry request
    return this.handleRequest(request, nbRetry + 1);
  }

  return this.handleResponse(response);
}

module.exports = { handleRequest };
