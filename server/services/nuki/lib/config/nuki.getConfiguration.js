const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/nuki.constants');

/**
 * @description Returns Nuki configuration informations.
 * @returns {Object} [configuration] Service connection informations.
 * @returns {string} [configuration.login] Login to the service.
 * @returns {string} [configuration.password]  Password to the service.
 * @example
 * nuki.getConfiguration();
 */
async function getConfiguration() {
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
