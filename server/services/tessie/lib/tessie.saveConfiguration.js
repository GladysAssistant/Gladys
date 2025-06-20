const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/tessie.constants');

/**
 * @description Save Tessie configuration.
 * @param {object} configuration - Configuration to save.
 * @returns {Promise<boolean>} Tessie well save configuration.
 * @example
 * await saveConfiguration({ apiKey: '...' });
 */
async function saveConfiguration(configuration) {
  logger.debug('Saving Tessie configuration...');
  const { apiKey } = configuration;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.API_KEY, apiKey, this.serviceId);
    this.configuration.apiKey = apiKey;
    logger.debug('Tessie configuration well stored');
    return true;
  } catch (e) {
    logger.error('Tessie configuration stored errored', e);
    return false;
  }
}

module.exports = {
  saveConfiguration,
};
