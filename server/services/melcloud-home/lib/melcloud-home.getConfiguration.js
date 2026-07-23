const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/melcloud-home.constants');

/**
 * @description Loads MELCloud Home stored configuration.
 * @returns {Promise} MELCloud Home configuration.
 * @example
 * await getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Loading MELCloud Home configuration...');
  const username = await this.gladys.variable.getValue(GLADYS_VARIABLES.USERNAME, this.serviceId);
  const password = await this.gladys.variable.getValue(GLADYS_VARIABLES.PASSWORD, this.serviceId);
  const refreshToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.REFRESH_TOKEN, this.serviceId);

  return {
    username,
    password,
    refreshToken,
  };
}

module.exports = {
  getConfiguration,
};
