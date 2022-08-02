const logger = require('../../../../utils/logger');

/**
 * @description Return Ecovacs status.
 * @returns {any} Null.
 * @example
 * ecovacs.getConfiguration();
 */
function getConfiguration() {
  logger.debug(`Ecovacs: config`);
  return null;
}

module.exports = {
  getConfiguration,
};
