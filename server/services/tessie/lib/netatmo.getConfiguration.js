const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { GLADYS_VARIABLES, STATUS } = require('./utils/tessie.constants');

/**
 * @description Loads Tessie stored configuration.
 * @returns {Promise} Tessie configuration.
 * @example
 * await getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Loading Tessie configuration...');
  const { serviceId } = this;
  try {
    this.configuration.clientId = await this.gladys.variable.getValue(GLADYS_VARIABLES.CLIENT_ID, serviceId);
    this.configuration.clientSecret = await this.gladys.variable.getValue(GLADYS_VARIABLES.CLIENT_SECRET, serviceId);
    this.configuration.energyApi =
      (await this.gladys.variable.getValue(GLADYS_VARIABLES.ENERGY_API, serviceId)) === '1';
    this.configuration.weatherApi =
      (await this.gladys.variable.getValue(GLADYS_VARIABLES.WEATHER_API, serviceId)) === '1';
    logger.debug(`Tessie configuration get: clientId='${this.configuration.clientId}'`);
    return this.configuration;
  } catch (e) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not configured.');
  }
}

module.exports = {
  getConfiguration,
};
