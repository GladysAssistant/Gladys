const logger = require('../../../../utils/logger');

/**
 * @description Ecovacs status.
 * @returns {any} Null.
 * @example
 * ecovacs.getStatus();
 */
function getStatus() {
  logger.debug(`Ecovacs: status`);
  return null;
}

module.exports = {
  getStatus,
};
