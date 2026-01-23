const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/nuki.constants');

/**
 * @typedef {object} Configuration
 * @property {string} apiKey API key to the service.
 */
/**
 * @description Returns Nuki configuration informations.
 * @returns {Configuration} Service connection informations.
 * @example
 * nuki.getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Nuki : get configuration');
  const apiKey = await this.gladys.variable.getValue(CONFIGURATION.NUKI_API_KEY, this.serviceId);
  return {
    apiKey,
  };
}

module.exports = {
  getConfiguration,
};
