const logger = require('../../../utils/logger');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  logger.debug('Connecting to Tuya...');
}

module.exports = {
  connect,
};
