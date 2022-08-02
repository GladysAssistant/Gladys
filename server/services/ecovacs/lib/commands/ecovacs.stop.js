const logger = require('../../../../utils/logger');

/**
 * @description Stops Ecovacs device.
 * @returns {any} Null.
 * @example
 * ecovacs.stop();
 */
async function stop() {
  logger.debug(`Ecovacs: Stopping`);
  return null;
}

module.exports = {
  stop,
};
