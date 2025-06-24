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
    this.configuration.apiKey = await this.gladys.variable.getValue(GLADYS_VARIABLES.API_KEY, serviceId);
    this.configuration.websocketEnabled = await this.gladys.variable.getValue(GLADYS_VARIABLES.WEBSOCKET_ENABLED, serviceId);
    logger.debug('Tessie configuration loaded successfully');
    return this.configuration;
  } catch (e) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not configured.');
  }
}

module.exports = {
  getConfiguration,
};
