const { GLADYS_VARIABLES, OAUTH } = require('../utils/melcloud-home.constants');

/**
 * @description Store an OAuth token response on the handler and persist the refresh token.
 * @param {object} tokens - Token response ({ access_token, refresh_token, expires_in }).
 * @returns {Promise} Promise of nothing.
 * @example
 * await storeTokens({ access_token: '...', refresh_token: '...', expires_in: 3600 });
 */
async function storeTokens(tokens) {
  this.accessToken = tokens.access_token;
  if (tokens.refresh_token) {
    this.refreshToken = tokens.refresh_token;
  }

  const expiresIn = tokens.expires_in || OAUTH.DEFAULT_EXPIRES_IN_SECONDS;
  this.tokenExpiresAt = Date.now() + (expiresIn - OAUTH.TOKEN_REFRESH_BUFFER_SECONDS) * 1000;

  if (this.refreshToken) {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.REFRESH_TOKEN, this.refreshToken, this.serviceId);
  }
}

module.exports = {
  storeTokens,
};
