const { GLADYS_VARIABLES, STATUS } = require('./utils/tessie.constants');
const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Tessie get access token.
 * @returns {Promise} Tessie access token.
 * @example
 * await tessie.getAccessToken();
 */
async function getAccessToken() {
  logger.debug('Loading Tessie access token...');
  const { serviceId } = this;
  try {
    this.accessToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_TOKEN, serviceId);
    if (!this.accessToken || this.accessToken === '') {
      const tokens = {
        accessToken: '',
        refreshToken: '',
        expireIn: '',
      };
      await this.setTokens(tokens);
      await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
      return undefined;
    }
    logger.debug(`Tessie access token well loaded`);
    return this.accessToken;
  } catch (e) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not configured.');
  }
}

module.exports = {
  getAccessToken,
};
