const logger = require('../../../../utils/logger');

/**
 * @description Starts Ecovacs device.
 * @returns {any} Null.
 * @example
 * ecovacs.start();
 */
async function start() {
  logger.debug(`Ecovacs: Starting`);
  return null;
}

module.exports = {
  start,
};
