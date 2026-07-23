const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/melcloud-home.constants');

/**
 * @description Disconnects service and dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  logger.debug('Disconnecting from MELCloud Home...');
  this.accessToken = null;
  this.refreshToken = null;
  this.tokenExpiresAt = null;
  this.status = STATUS.NOT_INITIALIZED;
}

module.exports = {
  disconnect,
};
