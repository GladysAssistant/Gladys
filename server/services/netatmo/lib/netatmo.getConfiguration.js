const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES, STATUS } = require('./utils/netatmo.constants');

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
  try {
    netatmoHandler.configuration.clientId = await netatmoHandler.gladys.variable.getValue(
      GLADYS_VARIABLES.CLIENT_ID,
      serviceId,
    );
    netatmoHandler.configuration.clientSecret = await netatmoHandler.gladys.variable.getValue(
      GLADYS_VARIABLES.CLIENT_SECRET,
      serviceId,
    );
    logger.debug(`Netatmo configuration get: clientId='${netatmoHandler.configuration.clientId}'`);
    return netatmoHandler.configuration;
  } catch (e) {
    netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
}

module.exports = {
  getConfiguration,
};
