const logger = require('../../../utils/logger');

/**
 * @description Disconnects service and dependencies.
 * @example
 * disconnect();
 */
async function disconnect() {
  logger.debug('Disonnecting from Tuya...');
}

module.exports = {
  disconnect,
};
