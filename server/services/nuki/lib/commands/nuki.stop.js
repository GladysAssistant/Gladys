const logger = require('../../../../utils/logger');

/**
 * @description Stops Nuki service.
 * @returns {any} Null.
 * @example
 * nuki.stop();
 */
function stop() {
  logger.debug(`Nuki: Stopping`);
  Object.values(this.protocols).forEach((handler) => handler.disconnect());
  return null;
}

module.exports = {
  stop,
};
