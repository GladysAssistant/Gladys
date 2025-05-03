const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/tessie.constants');

/**
 * @description Save Tessie configuration.
 * @param {object} configuration - Configuration to save.
 * @returns {Promise<boolean>} Tessie well save configuration.
 * @example
 * await saveConfiguration({ endpoint: '...', accessKey: '...', secretKey: '...'});
 */
async function saveConfiguration(configuration) {
  logger.debug('Saving Tessie configuration...');
  const { clientId, clientSecret, energyApi, weatherApi } = configuration;
  try {
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CLIENT_ID, clientId, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.CLIENT_SECRET, clientSecret, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.ENERGY_API, energyApi, this.serviceId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.WEATHER_API, weatherApi, this.serviceId);
    this.configuration.clientId = clientId;
    this.configuration.clientSecret = clientSecret;
    this.configuration.energyApi = energyApi;
    this.configuration.weatherApi = weatherApi;
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
