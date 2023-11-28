const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @description Save Netatmo configuration.
 * @param {object} netatmoHandler - Configuration to save.
 * @param {object} configuration - Configuration to save.
 * @returns {Promise} Netatmo configuration.
 * @example
 * await saveConfiguration({ endpoint: '...', accessKey: '...', secretKey: '...'});
 */
async function saveConfiguration(netatmoHandler, configuration) {
  logger.debug('Saving Netatmo configuration...');
  const { username, clientId, clientSecret, scopeEnergy } = configuration;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.USERNAME, username, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CLIENT_ID, clientId, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CLIENT_SECRET, clientSecret, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.SCOPE_ENERGY, scopeEnergy, this.serviceId);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  saveConfiguration,
};
