const { GLADYS_VARIABLES, STATUS } = require('./utils/tessie.constants');
const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Tessie get refresh token method.
 * @returns {Promise} Tessie refresh token.
 * @example
 * await tessie.getRefreshToken();
 */
async function getRefreshToken() {
  logger.debug('Loading Tessie refresh token...');
  const { serviceId } = this;
  try {
    this.refreshToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.REFRESH_TOKEN, serviceId);
    this.expireInToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, serviceId);
    if (!this.refreshToken) {
      const tokens = {
        accessToken: '',
        refreshToken: '',
        expireIn: '',
      };
      await this.setTokens(tokens);
      await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
      return undefined;
    }
    logger.debug(`Tessie refresh token well loaded`);
    return this.refreshToken;
  } catch (e) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not configured.');
  }
}

module.exports = {
  getRefreshToken,
};
