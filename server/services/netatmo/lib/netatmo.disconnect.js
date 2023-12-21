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
  netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.DISCONNECTING, message: null });
  const tokens = {
    accessToken: '',
    refreshToken: '',
    expireIn: 0,
  };
  netatmoHandler.setTokens(netatmoHandler, tokens);
  netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.DISCONNECTED, message: null });
  logger.debug('Netatmo disconnected');
}

module.exports = {
  disconnect,
};
