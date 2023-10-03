const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/tuya.constants');

/**
 * @description Disconnects service and dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  logger.debug('Disonnecting from Tuya...');
  this.connector = null;
  this.status = STATUS.NOT_INITIALIZED;
}

module.exports = {
  disconnect,
};
