const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/melcloud.constants');

/**
 * @description Disconnects service and dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  logger.debug('Disconnecting from MELCLoud...');
  this.contextKey = null;
  this.status = STATUS.NOT_INITIALIZED;
}

module.exports = {
  disconnect,
};
