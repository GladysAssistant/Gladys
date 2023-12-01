const logger = require('../../../../utils/logger');
const { CONFIGURATION_KEYS } = require('../utils/constants');

/**
 * @description Delete tokens and logout user.
 * @example
 * await this.deleteTokens();
 */
async function deleteTokens() {
  logger.info('eWeLink: disconnecting user...');
  // see https://coolkit-technologies.github.io/eWeLink-API/#/en/OAuth2.0?id=unbind-third-party-accounts
  const logoutCall = async () =>
    this.ewelinkClient.request.delete('/v2/user/oauth/token', {
      headers: {
        'X-CK-Appid': this.ewelinkClient.appId || '',
        Authorization: `Bearer ${this.ewelinkClient.at}`,
      },
    });

  await this.handleRequest(logoutCall);

  // Clear tokens
  await this.gladys.variable.destroy(CONFIGURATION_KEYS.USER_TOKENS, this.serviceId);
  this.ewelinkClient.at = null;
  this.ewelinkClient.rt = null;

  this.updateStatus({ connected: false });
  logger.info('eWeLink: user well disconnected');
}

module.exports = {
  deleteTokens,
};
