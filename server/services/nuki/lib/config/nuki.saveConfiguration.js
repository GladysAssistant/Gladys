const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/nuki.constants');

/**
 * @description Return Nuki status.
 * @param {object} [configuration] - Nuki configuration.
 * @param {string} [configuration.apiKey] - Nuki API key.
 * @returns {any} Null.
 * @example
 * nuki.saveConfiguration();
 */
async function saveConfiguration({ apiKey, }) {
  logger.debug(`Nuki: save config`);
  logger.debug(
    `Nuki: save config with ${CONFIGURATION.NUKI_API_KEY}=${apiKey}`,
  );
  await this.gladys.variable.setValue(CONFIGURATION.NUKI_API_KEY, apiKey, this.serviceId);
  return null;
}

module.exports = {
  saveConfiguration,
};
