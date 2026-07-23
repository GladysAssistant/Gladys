const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/melcloud-home.constants');

/**
 * @description Save MELCloud Home configuration.
 * @param {object} configuration - Configuration to save.
 * @returns {Promise} MELCloud Home configuration.
 * @example
 * await saveConfiguration({ username: '...', password: '...'});
 */
async function saveConfiguration(configuration) {
  logger.debug('Saving MELCloud Home configuration...');
  const { username, password } = configuration;
  await this.gladys.variable.setValue(GLADYS_VARIABLES.USERNAME, username, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.PASSWORD, password, this.serviceId);

  return configuration;
}

module.exports = {
  saveConfiguration,
};
