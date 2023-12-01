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

  const tokenResponse = await this.ewelinkClient.oauth.getToken({
    region,
    redirectUrl,
    code,
  });

  const data = await this.handleResponse(tokenResponse);

  this.ewelinkClient.at = data.accessToken;
  this.ewelinkClient.rt = data.refreshToken;

  await this.saveTokens(data);

  this.updateStatus({ connected: true });
  logger.info('eWeLink: user well connected...');
}

module.exports = {
  exchangeToken,
};
