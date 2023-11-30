const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @description Save Netatmo configuration.
 * @param {object} configuration - Configuration to save.
 * @returns {Promise<boolean>} Netatmo well save configuration.
 * @example
 * await saveConfiguration({ endpoint: '...', accessKey: '...', secretKey: '...'});
 */
async function saveConfiguration(configuration) {
  logger.debug('Saving Netatmo configuration...');
  const { username, clientId, clientSecret, scopeEnergy } = configuration;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.USERNAME, username, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CLIENT_ID, clientId, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CLIENT_SECRET, clientSecret, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.SCOPE_ENERGY, scopeEnergy, this.serviceId);
    logger.debug('Netatmo configuration well stored');
    return true;
  } catch (e) {
    logger.error('Netatmo configuration stored errored', e);
    return false;
  }
}

module.exports = {
  saveConfiguration,
};
