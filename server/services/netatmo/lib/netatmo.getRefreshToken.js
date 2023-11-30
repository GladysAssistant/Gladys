const { GLADYS_VARIABLES, STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');

/**
 * @description Netatmo get refresh token method.
 * @returns {Promise} Netatmo refresh token.
 * @example
 * await netatmo.getRefreshToken();
 */
async function getRefreshToken() {
  logger.debug('Loading Netatmo refresh token...');
  const refreshToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.REFRESH_TOKEN, this.serviceId);
  const expireToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, this.serviceId);
  if (!refreshToken || refreshToken === '') {
    const tokens = {
      accessToken: '',
      refreshToken: '',
      expireIn: '',
      connected: false,
    };
    await this.setTokens(tokens);
    this.status = STATUS.DISCONNECTED;
    return undefined;
  }
  logger.debug(`Netatmo refresh token well loaded`);
  return { refreshToken, expireToken };
}

module.exports = {
  getRefreshToken,
};
