const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');

/**
 * @description Disconnects service and dependencies.
 * @param {object} netatmoHandler - Netatmo handler.
 * @example
 * disconnect(netatmoHandler);
 */
function disconnect(netatmoHandler) {
  logger.debug('Disonnecting from Netatmo...');
  netatmoHandler.saveStatus({ statusType: STATUS.DISCONNECTING, message: null });
  const tokens = {
    accessToken: '',
    refreshToken: '',
    expireIn: 0,
    connected: false,
  };
  netatmoHandler.setTokens(netatmoHandler, tokens);
  clearInterval(netatmoHandler.pollRefreshToken);
  netatmoHandler.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
}

module.exports = {
  disconnect,
};
