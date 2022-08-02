const logger = require('../../../../utils/logger');

/**
 * @description Return Ecovacs status.
 * @returns {any} Null.
 * @example
 * ecovacs.saveConfiguration();
 */
function saveConfiguration() {
  logger.debug(`Ecovacs: save config`);
  return null;
}

module.exports = {
  saveConfiguration,
};
