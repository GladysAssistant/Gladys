const { BadParameters } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

/**
 * @description Generates a token for the connected user.
 * @param {object} params - EWeLink login configuration.
 * @param {string} [params.redirectUrl] - Login redirect URL.
 * @param {string} [params.code] - OAuth authorization code.
 * @param {string} [params.region] - User region.
 * @param {string} [params.state] - Login state.
 * @example
 * await this.exchangeToken({ redirectUrl, code, region, state });
 */
async function exchangeToken({ redirectUrl, code, region, state }) {
  logger.info('eWeLink: exchanging user authorization code...');

  if (state !== this.loginState) {
    throw new BadParameters('eWeLink login state is invalid');
  }

  const tokenResponse = await this.ewelinkWebAPIClient.oauth.getToken({
    region,
    redirectUrl,
    code,
  });

  const data = await this.handleResponse(tokenResponse);

  this.ewelinkWebAPIClient.at = data.accessToken;
  this.ewelinkWebAPIClient.rt = data.refreshToken;

  await this.saveTokens(data);

  await this.retrieveUserApiKey();

  await this.createWebSocketClient();

  this.updateStatus({ connected: true });
  logger.info('eWeLink: user well connected...');
}

module.exports = {
  exchangeToken,
};
