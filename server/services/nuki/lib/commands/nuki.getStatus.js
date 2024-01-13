const logger = require('../../../../utils/logger');

/**
 * @description Return Nuki service status.
 * @returns {any} Null.
 * @example
 * nuki.getStatus();
 */
function getStatus() {
  logger.debug(`Nuki: status`);
  return null;
}

module.exports = {
  getStatus,
};
