const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Implements Tuya connector get access token method.
 * @returns {Promise} Tuya access token.
 * @example
 * await tuya.getAccessToken();
 * @see https://github.com/tuya/tuya-connector-nodejs#custom-tokenstore
 */
async function getAccessToken() {
  logger.debug('Loading Tuya access token...');
  const accessToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_TOKEN, this.serviceId);
  logger.debug('Tuya access token well loaded');
  return accessToken;
}

module.exports = {
  getAccessToken,
};
