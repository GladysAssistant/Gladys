const { GLADYS_VARIABLES, STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

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
  try {
    netatmoHandler.accessToken = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_TOKEN, serviceId);
    if (!netatmoHandler.accessToken || netatmoHandler.accessToken === '') {
      const tokens = {
        accessToken: '',
        refreshToken: '',
        expireIn: '',
      };
      await netatmoHandler.setTokens(netatmoHandler, tokens);
      await netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.DISCONNECTED, message: null });
      return undefined;
    }
    logger.debug(`Netatmo access token well loaded`);
    return netatmoHandler.accessToken;
  } catch (e) {
    netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
}

/**
 * @description Netatmo get refresh token method.
 * @param {object} netatmoHandler - Netatmo handler.
 * @returns {Promise} Netatmo refresh token.
 * @example
 * await netatmo.getRefreshToken(netatmoHandler);
 */
async function getRefreshToken(netatmoHandler) {
  logger.debug('Loading Netatmo refresh token...');
  const { serviceId } = netatmoHandler;
  try {
    netatmoHandler.refreshToken = await netatmoHandler.gladys.variable.getValue(
      GLADYS_VARIABLES.REFRESH_TOKEN,
      serviceId,
    );
    netatmoHandler.expireInToken = await netatmoHandler.gladys.variable.getValue(
      GLADYS_VARIABLES.EXPIRE_IN_TOKEN,
      serviceId,
    );
    if (!netatmoHandler.refreshToken) {
      console.log('coucou', netatmoHandler.refresh_token)
      const tokens = {
        accessToken: '',
        refreshToken: '',
        expireIn: '',
      };
      await netatmoHandler.setTokens(netatmoHandler, tokens);
      await netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.DISCONNECTED, message: null });
      return undefined;
    }
    logger.debug(`Netatmo refresh token well loaded`);
    return netatmoHandler.refreshToken;
  } catch (e) {
    netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
}

module.exports = {
  getAccessToken,
  getRefreshToken,
};
