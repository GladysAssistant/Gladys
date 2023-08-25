const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Implements Tuya connector save token method.
 * @param {object} tokens - Tuya tokens.
 * @example
 * await tuya.setTokens({ access_token: '...', refresh_token:'...', expire_time: '...'});
 * @see https://github.com/tuya/tuya-connector-nodejs#custom-tokenstore
 */
async function setTokens(tokens) {
  logger.debug('Storing Tuya tokens...');
  await this.gladys.variable.setValue(GLADYS_VARIABLES.ACCESS_TOKEN, tokens.access_token, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.REFRESH_TOKEN, tokens.refresh_token, this.serviceId);
  logger.debug('Tuya tokens well stored');
}

module.exports = {
  setTokens,
};
