const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');

/**
 * @param {object} netatmoHandler - Of nothing.
 * @description Initialize service with properties and connect to devices.
 * @example
 * await init();
 */
async function init(netatmoHandler) {
  await netatmoHandler.getConfiguration(netatmoHandler);
  const { clientId, clientSecret } = netatmoHandler.configuration;
  if (!clientId || !clientSecret) {
    netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  netatmoHandler.configured = true;
  // TODO Limiter si redémarrages intempestifs ?
  await netatmoHandler.getAccessToken(netatmoHandler);
  await netatmoHandler.getRefreshToken(netatmoHandler);
  if (netatmoHandler.accessToken && netatmoHandler.refreshToken) {
    const response = await netatmoHandler.refreshingTokens();
    if (response.success) {
      netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.CONNECTED, message: null });
      logger.info('Netatmo successfull connect with status: ', netatmoHandler.status);
      await netatmoHandler.pollRefreshingToken(netatmoHandler);
      await netatmoHandler.pollRefreshingValues(netatmoHandler);
    } else {
      logger.error('Netatmo no successfull connect', response, ' with status: ', netatmoHandler.status);
      const tokens = {
        accessToken: '',
        refreshToken: '',
        expireIn: '',
      };
      await netatmoHandler.setTokens(tokens);
      netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.ERROR.PROCESSING_TOKEN, message: null });
    }
  } else {
    logger.debug('Netatmo no access or no refresh token');
    netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.DISCONNECTED, message: null });
  }
}

module.exports = {
  init,
};