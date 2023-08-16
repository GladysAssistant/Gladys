const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Implements Tuya connector get refresh token method.
 * @returns {Promise} Tuya refresh token.
 * @example
 * await tuya.getRefreshToken();
 * @see https://github.com/tuya/tuya-connector-nodejs#custom-tokenstore
 */
async function getRefreshToken() {
  logger.debug('Loading Tuya refresh token...');
  const refreshToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.REFRESH_TOKEN, this.serviceId);
  logger.debug('Tuya refresh token well loaded');
  return refreshToken;
}

module.exports = {
  getRefreshToken,
};
