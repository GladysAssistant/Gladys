const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');

/**
 * @description Disconnects service and dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  logger.debug('Disonnecting from Netatmo...');
  this.saveStatus({ statusType: STATUS.DISCONNECTING, message: null });
  const tokens = {
    accessToken: '',
    refreshToken: '',
    expireIn: 0,
  };
  this.setTokens(tokens);
  this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
  logger.debug('Netatmo disconnected');
}

module.exports = {
  disconnect,
};
