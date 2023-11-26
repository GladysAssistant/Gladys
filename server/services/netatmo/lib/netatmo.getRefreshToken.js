const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @description Implements Netatmo connector get refresh token method.
 * @returns {Promise} Netatmo refresh token.
 * @example
 * await netatmo.getRefreshToken();
 */
async function getRefreshToken() {
  logger.debug('Loading Netatmo refresh token...');
  const refreshToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.REFRESH_TOKEN, this.serviceId);
  logger.debug('Netatmo refresh token well loaded');
  return refreshToken;
}

module.exports = {
  getRefreshToken,
};
