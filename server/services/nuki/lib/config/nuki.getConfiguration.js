const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/nuki.constants');

/**
 * @typedef {object} Configuration
 * @property {string} login Login to the service.
 * @property {number} password Password to the service.
 */
/**
 * @description Returns Nuki configuration informations.
 * @returns {Configuration} Service connection informations.
 * @example
 * nuki.getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Nuki : get configuration');
  const login = await this.gladys.variable.getValue(CONFIGURATION.NUKI_LOGIN_KEY, this.serviceId);
  const password = await this.gladys.variable.getValue(CONFIGURATION.NUKI_PASSWORD_KEY, this.serviceId);
  return {
    login,
    password,
  };
}

module.exports = {
  getConfiguration,
};
