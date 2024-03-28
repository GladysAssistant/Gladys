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
    this.ewelinkWebAPIClient.request.delete('/v2/user/oauth/token', {
      headers: {
        'X-CK-Appid': this.ewelinkWebAPIClient.appId || '',
        Authorization: `Bearer ${this.ewelinkWebAPIClient.at}`,
      },
    });

  await this.handleRequest(logoutCall);

  // Clear tokens
  await this.gladys.variable.destroy(CONFIGURATION_KEYS.USER_TOKENS, this.serviceId);

  this.ewelinkWebAPIClient.at = null;
  this.ewelinkWebAPIClient.rt = null;

  this.closeWebSocketClient();

  this.updateStatus({ connected: false });
  logger.info('eWeLink: user well disconnected');
}

module.exports = {
  deleteTokens,
};
