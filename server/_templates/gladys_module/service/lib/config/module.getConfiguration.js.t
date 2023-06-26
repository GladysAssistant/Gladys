---
to: ./services/<%= module %>/lib/config/<%= module %>.getConfiguration.js
---
const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/<%= module %>.constants');

/**
 * @description Returns <%= className %> configuration informations.
 * @returns {Object} [configuration] Service connection informations.
 * @returns {string} [configuration.login] Login to the service.
 * @returns {string} [configuration.password]  Password to the service.
 * @example
 * <%= module %>.getConfiguration();
 */
async function getConfiguration() {
  const login = await this.gladys.variable.getValue(CONFIGURATION.<%= constName %>_LOGIN_KEY, this.serviceId);
  const password = await this.gladys.variable.getValue(CONFIGURATION.<%= constName %>_PASSWORD_KEY, this.serviceId);
  logger.debug(`<%= className %> return config login=${login}, password=${password}`);
  return {
    login,
    password,
  };
}

module.exports = {
  getConfiguration,
};
