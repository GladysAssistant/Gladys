const { GLADYS_VARIABLES, STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');

/**
 * @description Netatmo get refresh token method.
 * @param {object} netatmoHandler - Netatmo handler.
 * @returns {Promise} Netatmo refresh token.
 * @example
 * await netatmo.getRefreshToken(netatmoHandler);
 */
async function getRefreshToken(netatmoHandler) {
  logger.debug('Loading Netatmo refresh token...');
  const {serviceId} = netatmoHandler;
  netatmoHandler.refreshToken = await netatmoHandler.gladys.variable.getValue(
    GLADYS_VARIABLES.REFRESH_TOKEN,
    serviceId,
  );
  netatmoHandler.expireInToken = await netatmoHandler.gladys.variable.getValue(
    GLADYS_VARIABLES.EXPIRE_IN_TOKEN,
    serviceId,
  );
  if (!netatmoHandler.refreshToken) {
    const tokens = {
      accessToken: '',
      refreshToken: '',
      expireIn: '',
      connected: false,
    };
    await netatmoHandler.setTokens(netatmoHandler, tokens);
    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
    return undefined;
  }
  logger.debug(`Netatmo refresh token well loaded`);
  return netatmoHandler.refreshToken;
}

module.exports = {
  getRefreshToken,
};
