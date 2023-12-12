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
  const { serviceId } = netatmoHandler;
  netatmoHandler.configuration.username = await netatmoHandler.gladys.variable.getValue(
    GLADYS_VARIABLES.USERNAME,
    serviceId,
  );
  netatmoHandler.configuration.clientId = await netatmoHandler.gladys.variable.getValue(
    GLADYS_VARIABLES.CLIENT_ID,
    serviceId,
  );
  netatmoHandler.configuration.clientSecret = await netatmoHandler.gladys.variable.getValue(
    GLADYS_VARIABLES.CLIENT_SECRET,
    serviceId,
  );
  // const scopeEnergy = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.SCOPE_ENERGY, serviceId);
  // const connected = await netatmoHandler.gladys.variable.getValue(GLADYS_VARIABLES.CONNECTED, serviceId);
  // const scopes = { scopeEnergy };

  logger.debug(
    `Netatmo configuration: username='${netatmoHandler.configuration.username}' clientId='${netatmoHandler.configuration.clientId}'`,
  );
  return netatmoHandler.configuration;
}

module.exports = {
  getConfiguration,
};
