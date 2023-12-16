const { GLADYS_VARIABLES, STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');

/**
 * @description Netatmo get access token.
 * @param {object} netatmoHandler - Netatmo handler.
 * @returns {Promise} Netatmo access token.
 * @example
 * await netatmo.getAccessToken(netatmoHandler);
 */
async function getAccessToken(netatmoHandler) {
  logger.debug('Loading Netatmo access token...');
  const { serviceId } = netatmoHandler;
  netatmoHandler.accessToken = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_TOKEN, serviceId);
  if (!netatmoHandler.accessToken || netatmoHandler.accessToken === '') {
    const tokens = {
      accessToken: '',
      refreshToken: '',
      expireIn: '',
    };
    await netatmoHandler.setTokens(netatmoHandler, tokens);
    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
    return undefined;
  }
  logger.debug(`Netatmo access token well loaded`);
  return netatmoHandler.accessToken;
}

module.exports = {
  getAccessToken,
};
