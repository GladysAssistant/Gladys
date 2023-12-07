const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES } = require('./utils/netatmo.constants');

/**
 * @param {object} netatmoHandler - Of nothing.
 * @description Loads Netatmo stored configuration.
 * @returns {Promise} Netatmo configuration.
 * @example
 * await getConfiguration();
 */
async function getConfiguration(netatmoHandler) {
  logger.debug('Loading Netatmo configuration...');
  const {serviceId} = netatmoHandler;
  const username = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.USERNAME, serviceId);
  const clientId = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.CLIENT_ID, serviceId);
  const clientSecret = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.CLIENT_SECRET, serviceId);
  const scopeEnergy = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.SCOPE_ENERGY, serviceId);
  const connected = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.CONNECTED, serviceId);
  const scopes = { scopeEnergy };

  logger.debug(`Netatmo configuration: username='${username}' clientId='${clientId}'`);
  this.configuration = {
    username,
    clientId,
    clientSecret,
    scopes,
    connected,
  };
  return this.configuration;
}

module.exports = {
  getConfiguration,
};
