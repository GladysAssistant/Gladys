const logger = require('../../../utils/logger');

/**
 * @description Poll refreshing Token values of an Netatmo device.
 * @example refreshNetatmoTokens();
 */
async function refreshNetatmoTokens() {
  const { expireInToken } = this;
  await this.refreshingTokens();
  if (this.expireInToken !== expireInToken) {
    logger.warn(`New expiration access_token : ${this.expireInToken}ms `);
    clearInterval(this.pollRefreshToken);
    await this.pollRefreshingToken();
  }
}

/**
 * @description Poll refreshing Token values of an Netatmo device.
 * @example pollRefreshingToken();
 */
function pollRefreshingToken() {
  if (this.expireInToken > 0) {
    this.pollRefreshToken = setInterval(refreshNetatmoTokens.bind(this), this.expireInToken * 1000);
  }
}

module.exports = {
  pollRefreshingToken,
};
