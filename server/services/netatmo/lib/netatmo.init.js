const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');

/**
 * @description Initialize service with properties and connect to devices.
 * @example
 * await init();
 */
async function init() {
  await this.getConfiguration();
  const { clientId, clientSecret } = this.configuration;
  if (!clientId || !clientSecret) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  this.configured = true;
  await this.getAccessToken();
  await this.getRefreshToken();
  if (this.accessToken && this.refreshToken) {
    const response = await this.refreshingTokens();
    if (response.success) {
      await this.pollRefreshingTokens();
      await this.pollRefreshingValues();
    }
  } else {
    logger.debug('Netatmo no access or no refresh token');
    this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
  }
}

module.exports = {
  init,
};
