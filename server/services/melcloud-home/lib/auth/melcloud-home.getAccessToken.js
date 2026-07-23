const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const oauth = require('./melcloud-home.oauth');

/**
 * @description Return a valid access token, refreshing it if it has expired.
 * @returns {Promise<string>} A valid access token.
 * @example
 * const token = await getAccessToken();
 */
async function getAccessToken() {
  const now = Date.now();
  if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
    return this.accessToken;
  }

  if (!this.refreshToken) {
    throw new ServiceNotConfiguredError('MELCloud Home is not connected.');
  }

  const tokens = await oauth.refresh(this.refreshToken);
  await this.storeTokens(tokens);
  return this.accessToken;
}

module.exports = {
  getAccessToken,
};
