const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/melcloud.constants');

/**
 * @description Save MELCloud configuration.
 * @param {object} configuration - Configuration to save.
 * @returns {Promise} MELCloud configuration.
 * @example
 * await saveConfiguration({ username: '...', password: '...'});
 */
async function saveConfiguration(configuration) {
  logger.debug('Saving MELCloud configuration...');
  const { username, password } = configuration;
  await this.gladys.variable.setValue(GLADYS_VARIABLES.USERNAME, username, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.PASSWORD, password, this.serviceId);

  return configuration;
}

module.exports = {
  saveConfiguration,
};
