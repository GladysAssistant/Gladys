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
  const { apiKey, websocketEnabled } = configuration;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.API_KEY, apiKey, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.WEBSOCKET_ENABLED, websocketEnabled, this.serviceId);
    this.configuration.apiKey = apiKey;
    this.configuration.websocketEnabled = websocketEnabled;
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
