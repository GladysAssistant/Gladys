const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @description Netatmo save token method.
 * @param {object} netatmoHandler - Netatmo handler.
 * @param {object} tokens - Netatmo tokens.
 * @returns {Promise<boolean>} Netatmo well set Tokens.
 * @example
 * await netatmo.setTokens({ access_token: '...', refresh_token:'...', expire_time: ...});
 */
async function setTokens(netatmoHandler, tokens) {
  logger.debug('Storing Netatmo tokens...');
  const { serviceId } = netatmoHandler;
  const { accessToken, refreshToken, expireIn } = tokens;
  // const { accessToken, refreshToken, expireIn, connected } = tokens;
  try {
    await netatmoHandler.gladys.variable.setValue(GLADYS_VARIABLES.ACCESS_TOKEN, accessToken, serviceId);
    await netatmoHandler.gladys.variable.setValue(GLADYS_VARIABLES.REFRESH_TOKEN, refreshToken, serviceId);
    await netatmoHandler.gladys.variable.setValue(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, expireIn, serviceId);
    // await netatmoHandler.gladys.variable.setValue(GLADYS_VARIABLES.CONNECTED, connected, serviceId);
    netatmoHandler.accessToken = accessToken;
    netatmoHandler.refreshToken = refreshToken;
    netatmoHandler.expireInToken = expireIn;
    // netatmoHandler.connected = connected;
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
