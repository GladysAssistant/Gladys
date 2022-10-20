const logger = require('../../../../utils/logger');

/**
 * @description Overkiz config
 * @example
 * overkiz.config();
 */
function config() {
  logger.debug(`Overkiz : Config`);
}

/**
 * @description Enable Discovery
 * @example
 * overkiz.enableDiscovery();
 */
function enableDiscovery() {
  logger.debug(`Overkiz : Enable discovery`);
}

/**
 * @description Disable Discovery
 * @example
 * overkiz.disableDiscovery();
 */
function disableDiscovery() {
  logger.debug(`Overkiz : Disable discovery`);
}

module.exports = {
  config,
  enableDiscovery,
  disableDiscovery,
};
