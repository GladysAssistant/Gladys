const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @description Netatmo save token method.
 * @param {object} tokens - Netatmo tokens.
 * @example
 * await netatmo.setTokens({ access_token: '...', refresh_token:'...', expire_time: ...});
 */
async function setTokens(tokens) {
  logger.debug('Storing Netatmo tokens...');
  const { access_token, refresh_token, expire_in, connected } = tokens;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.ACCESS_TOKEN, access_token, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.REFRESH_TOKEN, refresh_token, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, expire_in, this.serviceId);
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
