const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @description Netatmo save token method.
 * @param {object} tokens - Netatmo tokens.
 * @returns {Promise<boolean>} Netatmo well set Tokens.
 * @example
 * await netatmo.setTokens({ access_token: '...', refresh_token:'...', expire_time: ...});
 */
async function setTokens(tokens) {
  logger.debug('Storing Netatmo tokens...');
  const { accessToken, refreshToken, expireIn, connected } = tokens;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.ACCESS_TOKEN, accessToken, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.REFRESH_TOKEN, refreshToken, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, expireIn, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CONNECTED, connected, this.serviceId);
    logger.debug('Netatmo tokens well stored');
    return true;
  } catch (e) {
    logger.error('Netatmo tokens stored errored', e);
    return false;
  }
}

module.exports = {
  setTokens,
};
