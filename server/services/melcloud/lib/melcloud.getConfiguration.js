const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/melcloud.constants');

/**
 * @description Loads MELCloud stored configuration.
 * @returns {Promise} MELCloud configuration.
 * @example
 * await getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Loading MELCloud configuration...');
  const username = await this.gladys.variable.getValue(GLADYS_VARIABLES.USERNAME, this.serviceId);
  const password = await this.gladys.variable.getValue(GLADYS_VARIABLES.PASSWORD, this.serviceId);

  return {
    username,
    password,
  };
}

module.exports = {
  getConfiguration,
};
