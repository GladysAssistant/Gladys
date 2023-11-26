const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @description Implements Netatmo connector save token method.
 * @param {object} tokens - Netatmo tokens.
 * @example
 * await netatmo.setTokens({ access_token: '...', refresh_token:'...', expire_time: '...'});
 */
async function setTokens(tokens) {
  logger.debug('Storing Netatmo tokens...');
  console.log(tokens)
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.ACCESS_TOKEN, tokens.access_token, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.REFRESH_TOKEN, tokens.refresh_token, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, tokens.expire_in, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CONNECTED, tokens.connected, this.serviceId);
  } catch (e) {
    logger.error('Netatmo tokens stored errored');
  }
  logger.debug('Netatmo tokens well stored');
}

module.exports = {
  setTokens,
};
