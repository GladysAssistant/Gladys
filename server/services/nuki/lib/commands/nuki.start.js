const logger = require('../../../../utils/logger');

/**
 * @description Initialize Nuki service with dependencies.
 * @returns {any} Null.
 * @example
 * nuki.start();
 */
function start() {
  logger.debug(`Nuki: Starting`);
  Object.values(this.protocols).forEach((handler) => handler.connect());
  return null;
}

module.exports = {
  start,
};
