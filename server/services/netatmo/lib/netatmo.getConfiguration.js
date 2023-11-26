const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @description Loads Netatmo stored configuration.
 * @returns {Promise} Netatmo configuration.
 * @example
 * await getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Loading Netatmo configuration...');
  const username = await this.gladys.variable.getValue(GLADYS_VARIABLES.USERNAME, this.serviceId);
  const clientId = await this.gladys.variable.getValue(GLADYS_VARIABLES.CLIENT_ID, this.serviceId);
  const clientSecret = await this.gladys.variable.getValue(GLADYS_VARIABLES.CLIENT_SECRET, this.serviceId);
  const scopeEnergy = await this.gladys.variable.getValue(GLADYS_VARIABLES.SCOPE_ENERGY, this.serviceId);
  const connected = await this.gladys.variable.getValue(GLADYS_VARIABLES.CONNECTED, this.serviceId);
  const accessToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_TOKEN, this.serviceId);
  const refreshToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.REFRESH_TOKEN, this.serviceId);
  
  const scopes = { scopeEnergy }

  logger.error(accessToken);
  logger.debug(`Netatmo configuration: username='${username}' clientId='${clientId}'`);
  const baseUrl = 'https://api.netatmo.net';

  return {
    baseUrl,
    username,
    clientId,
    clientSecret,
    accessToken,
    refreshToken,
    scopes,
  };
}

module.exports = {
  getConfiguration,
};
