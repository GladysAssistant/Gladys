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
  const scopes = { scopeEnergy };

  logger.debug(`Netatmo configuration: username='${username}' clientId='${clientId}'`);

  return {
    username,
    clientId,
    clientSecret,
    scopes,
    connected,
  };
}

module.exports = {
  getConfiguration,
};
